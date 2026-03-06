/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import type { Content } from '@google/genai';
import type { ServerGeminiStreamEvent } from '../core/turn.js';
import { GeminiEventType } from '../core/turn.js';
import type { Config } from '../config/config.js';
import { DEFAULT_QWEN_MODEL } from '../config/models.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import {
  isFunctionCall,
  isFunctionResponse,
} from '../utils/messageInspectors.js';

const TOOL_CALL_LOOP_THRESHOLD = 5;
const CONTENT_LOOP_THRESHOLD = 10;
const CONTENT_CHUNK_SIZE = 50;
const MAX_HISTORY_LENGTH = 1000;

// LLM-based loop detection constants
const LLM_CHECK_AFTER_TURNS = 30;
const MIN_LLM_CHECK_INTERVAL = 5;
const MAX_LLM_CHECK_INTERVAL = 15;
const LLM_LOOP_CHECK_HISTORY_COUNT = 20;

const LOOP_DETECTION_SYSTEM_PROMPT = `You are an expert at detecting unproductive repetitive patterns in AI conversations.
Analyze the conversation history and determine if the AI is stuck in a loop, repeating the same actions or responses without making progress.
Respond with a JSON object containing 'reasoning' (string) and 'confidence' (number 0.0-1.0) where 1.0 means definitely stuck in a loop.`;

const debugLogger = createDebugLogger('LOOP_DETECTION');

/**
 * Service for detecting and preventing infinite loops in AI responses.
 * Monitors tool call repetitions and content sentence repetitions.
 */
export class LoopDetectionService {
  private readonly config: Config;
  private promptId = '';

  // Tool call tracking
  private lastToolCallKey: string | null = null;
  private toolCallRepetitionCount: number = 0;

  // Content streaming tracking
  private streamContentHistory = '';
  private contentStats = new Map<string, number[]>();
  private lastContentIndex = 0;
  private loopDetected = false;
  private inCodeBlock = false;

  // Session-level disable flag
  private disabledForSession = false;

  // LLM-based loop detection state
  private turnCount = 0;
  private lastLLMCheckTurn = 0;
  private llmCheckInterval = MAX_LLM_CHECK_INTERVAL;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Disables loop detection for the current session.
   */
  disableForSession(): void {
    this.disabledForSession = true;
  }

  private getToolCallKey(toolCall: { name: string; args: object }): string {
    const argsString = JSON.stringify(toolCall.args);
    const keyString = `${toolCall.name}:${argsString}`;
    return createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Processes a stream event and checks for loop conditions.
   * @param event - The stream event to process
   * @returns true if a loop is detected, false otherwise
   */
  addAndCheck(event: ServerGeminiStreamEvent): boolean {
    if (this.loopDetected || this.disabledForSession) {
      return this.loopDetected;
    }

    switch (event.type) {
      case GeminiEventType.ToolCallRequest:
        // content chanting only happens in one single stream, reset if there
        // is a tool call in between
        this.resetContentTracking();
        this.loopDetected = this.checkToolCallLoop(event.value);
        break;
      case GeminiEventType.Content:
        this.loopDetected = this.checkContentLoop(event.value);
        break;
      default:
        break;
    }
    return this.loopDetected;
  }

  private checkToolCallLoop(toolCall: { name: string; args: object }): boolean {
    const key = this.getToolCallKey(toolCall);
    if (this.lastToolCallKey === key) {
      this.toolCallRepetitionCount++;
    } else {
      this.lastToolCallKey = key;
      this.toolCallRepetitionCount = 1;
    }
    if (this.toolCallRepetitionCount >= TOOL_CALL_LOOP_THRESHOLD) {
      return true;
    }
    return false;
  }

  /**
   * Detects content loops by analyzing streaming text for repetitive patterns.
   *
   * The algorithm works by:
   * 1. Appending new content to the streaming history
   * 2. Truncating history if it exceeds the maximum length
   * 3. Analyzing content chunks for repetitive patterns using hashing
   * 4. Detecting loops when identical chunks appear frequently within a short distance
   * 5. Disabling loop detection within code blocks to prevent false positives,
   *    as repetitive code structures are common and not necessarily loops.
   */
  private checkContentLoop(content: string): boolean {
    // Different content elements can often contain repetitive syntax that is not indicative of a loop.
    // To avoid false positives, we detect when we encounter different content types and
    // reset tracking to avoid analyzing content that spans across different element boundaries.
    const numFences = (content.match(/```/g) ?? []).length;
    const hasTable = /(^|\n)\s*(\|.*\||[|+-]{3,})/.test(content);
    const hasListItem =
      /(^|\n)\s*[*-+]\s/.test(content) || /(^|\n)\s*\d+\.\s/.test(content);
    const hasHeading = /(^|\n)#+\s/.test(content);
    const hasBlockquote = /(^|\n)>\s/.test(content);
    const isDivider = /^[+-_=*\u2500-\u257F]+$/.test(content);

    if (
      numFences ||
      hasTable ||
      hasListItem ||
      hasHeading ||
      hasBlockquote ||
      isDivider
    ) {
      // Reset tracking when different content elements are detected to avoid analyzing content
      // that spans across different element boundaries.
      this.resetContentTracking();
    }

    const wasInCodeBlock = this.inCodeBlock;
    this.inCodeBlock =
      numFences % 2 === 0 ? this.inCodeBlock : !this.inCodeBlock;
    if (wasInCodeBlock || this.inCodeBlock || isDivider) {
      return false;
    }

    this.streamContentHistory += content;

    this.truncateAndUpdate();
    return this.analyzeContentChunksForLoop();
  }

  /**
   * Truncates the content history to prevent unbounded memory growth.
   * When truncating, adjusts all stored indices to maintain their relative positions.
   */
  private truncateAndUpdate(): void {
    if (this.streamContentHistory.length <= MAX_HISTORY_LENGTH) {
      return;
    }

    // Calculate how much content to remove from the beginning
    const truncationAmount =
      this.streamContentHistory.length - MAX_HISTORY_LENGTH;
    this.streamContentHistory =
      this.streamContentHistory.slice(truncationAmount);
    this.lastContentIndex = Math.max(
      0,
      this.lastContentIndex - truncationAmount,
    );

    // Update all stored chunk indices to account for the truncation
    for (const [hash, oldIndices] of this.contentStats.entries()) {
      const adjustedIndices = oldIndices
        .map((index) => index - truncationAmount)
        .filter((index) => index >= 0);

      if (adjustedIndices.length > 0) {
        this.contentStats.set(hash, adjustedIndices);
      } else {
        this.contentStats.delete(hash);
      }
    }
  }

  /**
   * Analyzes content in fixed-size chunks to detect repetitive patterns.
   *
   * Uses a sliding window approach:
   * 1. Extract chunks of fixed size (CONTENT_CHUNK_SIZE)
   * 2. Hash each chunk for efficient comparison
   * 3. Track positions where identical chunks appear
   * 4. Detect loops when chunks repeat frequently within a short distance
   */
  private analyzeContentChunksForLoop(): boolean {
    while (this.hasMoreChunksToProcess()) {
      // Extract current chunk of text
      const currentChunk = this.streamContentHistory.substring(
        this.lastContentIndex,
        this.lastContentIndex + CONTENT_CHUNK_SIZE,
      );
      const chunkHash = createHash('sha256').update(currentChunk).digest('hex');

      if (this.isLoopDetectedForChunk(currentChunk, chunkHash)) {
        return true;
      }

      // Move to next position in the sliding window
      this.lastContentIndex++;
    }

    return false;
  }

  private hasMoreChunksToProcess(): boolean {
    return (
      this.lastContentIndex + CONTENT_CHUNK_SIZE <=
      this.streamContentHistory.length
    );
  }

  /**
   * Determines if a content chunk indicates a loop pattern.
   *
   * Loop detection logic:
   * 1. Check if we've seen this hash before (new chunks are stored for future comparison)
   * 2. Verify actual content matches to prevent hash collisions
   * 3. Track all positions where this chunk appears
   * 4. A loop is detected when the same chunk appears CONTENT_LOOP_THRESHOLD times
   *    within a small average distance (≤ 1.5 * chunk size)
   */
  private isLoopDetectedForChunk(chunk: string, hash: string): boolean {
    const existingIndices = this.contentStats.get(hash);

    if (!existingIndices) {
      this.contentStats.set(hash, [this.lastContentIndex]);
      return false;
    }

    if (!this.isActualContentMatch(chunk, existingIndices[0])) {
      return false;
    }

    existingIndices.push(this.lastContentIndex);

    if (existingIndices.length < CONTENT_LOOP_THRESHOLD) {
      return false;
    }

    // Analyze the most recent occurrences to see if they're clustered closely together
    const recentIndices = existingIndices.slice(-CONTENT_LOOP_THRESHOLD);
    const totalDistance =
      recentIndices[recentIndices.length - 1] - recentIndices[0];
    const averageDistance = totalDistance / (CONTENT_LOOP_THRESHOLD - 1);
    const maxAllowedDistance = CONTENT_CHUNK_SIZE * 1.5;

    return averageDistance <= maxAllowedDistance;
  }

  /**
   * Verifies that two chunks with the same hash actually contain identical content.
   * This prevents false positives from hash collisions.
   */
  private isActualContentMatch(
    currentChunk: string,
    originalIndex: number,
  ): boolean {
    const originalChunk = this.streamContentHistory.substring(
      originalIndex,
      originalIndex + CONTENT_CHUNK_SIZE,
    );
    return originalChunk === currentChunk;
  }

  private trimRecentHistory(recentHistory: Content[]): Content[] {
    // A function response must be preceded by a function call.
    // Continuously removes dangling function calls from the end of the history
    // until the last turn is not a function call.
    while (
      recentHistory.length > 0 &&
      isFunctionCall(recentHistory[recentHistory.length - 1])
    ) {
      recentHistory.pop();
    }

    // A function response should follow a function call.
    // Continuously removes leading function responses from the beginning of history
    // until the first turn is not a function response.
    while (recentHistory.length > 0 && isFunctionResponse(recentHistory[0])) {
      recentHistory.shift();
    }

    return recentHistory;
  }

  private async checkForLoopWithLLM(signal: AbortSignal) {
    const recentHistory = this.config
      .getGeminiClient()
      .getHistory()
      .slice(-LLM_LOOP_CHECK_HISTORY_COUNT);

    const trimmedHistory = this.trimRecentHistory(recentHistory);

    const taskPrompt = `Please analyze the conversation history to determine the possibility that the conversation is stuck in a repetitive, non-productive state. Provide your response in the requested JSON format.`;

    const contents = [
      ...trimmedHistory,
      { role: 'user', parts: [{ text: taskPrompt }] },
    ];
    const schema: Record<string, unknown> = {
      type: 'object',
      properties: {
        reasoning: {
          type: 'string',
          description:
            'Your reasoning on if the conversation is looping without forward progress.',
        },
        confidence: {
          type: 'number',
          description:
            'A number between 0.0 and 1.0 representing your confidence that the conversation is in an unproductive state.',
        },
      },
      required: ['reasoning', 'confidence'],
    };
    let result;
    try {
      result = await this.config.getBaseLlmClient().generateJson({
        contents,
        schema,
        model: this.config.getModel() || DEFAULT_QWEN_MODEL,
        systemInstruction: LOOP_DETECTION_SYSTEM_PROMPT,
        abortSignal: signal,
        promptId: this.promptId,
      });
    } catch (e) {
      // Do nothing, treat it as a non-loop.
      this.config.getDebugLogger().error(e);
      return false;
    }

    if (typeof result['confidence'] === 'number') {
      if (result['confidence'] > 0.9) {
        if (typeof result['reasoning'] === 'string' && result['reasoning']) {
          debugLogger.warn(result['reasoning']);
        }
        return true;
      } else {
        this.llmCheckInterval = Math.round(
          MIN_LLM_CHECK_INTERVAL +
            (MAX_LLM_CHECK_INTERVAL - MIN_LLM_CHECK_INTERVAL) *
              (1 - result['confidence']),
        );
      }
    }
    return false;
  }


  /**
   * Called at the start of each turn. Performs LLM-based loop detection after
   * a minimum number of turns, then periodically based on confidence.
   *
   * @param signal - AbortSignal for cancellation
   * @returns true if a loop is detected, false otherwise
   */
  async turnStarted(signal: AbortSignal): Promise<boolean> {
    if (this.disabledForSession) {
      return false;
    }

    this.turnCount++;

    const isFirstCheck =
      this.lastLLMCheckTurn === 0 &&
      this.turnCount >= LLM_CHECK_AFTER_TURNS;
    const isSubsequentCheck =
      this.lastLLMCheckTurn > 0 &&
      this.turnCount - this.lastLLMCheckTurn >= this.llmCheckInterval;

    if (isFirstCheck || isSubsequentCheck) {
      this.lastLLMCheckTurn = this.turnCount;
      return this.checkForLoopWithLLM(signal);
    }

    return false;
  }

  /**
   * Resets all loop detection state.
   */
  reset(promptId: string): void {
    this.promptId = promptId;
    this.resetToolCallCount();
    this.resetContentTracking();
    this.loopDetected = false;
    this.turnCount = 0;
    this.lastLLMCheckTurn = 0;
    this.llmCheckInterval = MAX_LLM_CHECK_INTERVAL;
  }

  private resetToolCallCount(): void {
    this.lastToolCallKey = null;
    this.toolCallRepetitionCount = 0;
  }

  private resetContentTracking(resetHistory = true): void {
    if (resetHistory) {
      this.streamContentHistory = '';
    }
    this.contentStats.clear();
    this.lastContentIndex = 0;
  }
}
