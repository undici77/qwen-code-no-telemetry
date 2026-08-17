import { z } from 'zod';
import type { CanUseTool } from './types.js';
import type { SubagentConfig } from './protocol.js';
/**
 * OAuth configuration for MCP servers
 */
export declare const McpOAuthConfigSchema: z.ZodObject<
  {
    enabled: z.ZodOptional<z.ZodBoolean>;
    clientId: z.ZodOptional<z.ZodString>;
    clientSecret: z.ZodOptional<z.ZodString>;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    redirectUri: z.ZodOptional<z.ZodString>;
    authorizationUrl: z.ZodOptional<z.ZodString>;
    tokenUrl: z.ZodOptional<z.ZodString>;
    audiences: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    tokenParamName: z.ZodOptional<z.ZodString>;
    registrationUrl: z.ZodOptional<z.ZodString>;
  },
  'strict',
  z.ZodTypeAny,
  {
    enabled?: boolean | undefined;
    clientId?: string | undefined;
    scopes?: string[] | undefined;
    clientSecret?: string | undefined;
    redirectUri?: string | undefined;
    authorizationUrl?: string | undefined;
    tokenUrl?: string | undefined;
    audiences?: string[] | undefined;
    tokenParamName?: string | undefined;
    registrationUrl?: string | undefined;
  },
  {
    enabled?: boolean | undefined;
    clientId?: string | undefined;
    scopes?: string[] | undefined;
    clientSecret?: string | undefined;
    redirectUri?: string | undefined;
    authorizationUrl?: string | undefined;
    tokenUrl?: string | undefined;
    audiences?: string[] | undefined;
    tokenParamName?: string | undefined;
    registrationUrl?: string | undefined;
  }
>;
/**
 * CLI MCP Server configuration schema
 *
 * Supports multiple transport types:
 * - stdio: command, args, env, cwd
 * - SSE: url
 * - Streamable HTTP: httpUrl, headers
 * - WebSocket: tcp
 */
export declare const CLIMcpServerConfigSchema: z.ZodObject<
  {
    command: z.ZodOptional<z.ZodString>;
    args: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    httpUrl: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    tcp: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    trust: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    includeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    extensionName: z.ZodOptional<z.ZodString>;
    oauth: z.ZodOptional<
      z.ZodObject<
        {
          enabled: z.ZodOptional<z.ZodBoolean>;
          clientId: z.ZodOptional<z.ZodString>;
          clientSecret: z.ZodOptional<z.ZodString>;
          scopes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          redirectUri: z.ZodOptional<z.ZodString>;
          authorizationUrl: z.ZodOptional<z.ZodString>;
          tokenUrl: z.ZodOptional<z.ZodString>;
          audiences: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          tokenParamName: z.ZodOptional<z.ZodString>;
          registrationUrl: z.ZodOptional<z.ZodString>;
        },
        'strict',
        z.ZodTypeAny,
        {
          enabled?: boolean | undefined;
          clientId?: string | undefined;
          scopes?: string[] | undefined;
          clientSecret?: string | undefined;
          redirectUri?: string | undefined;
          authorizationUrl?: string | undefined;
          tokenUrl?: string | undefined;
          audiences?: string[] | undefined;
          tokenParamName?: string | undefined;
          registrationUrl?: string | undefined;
        },
        {
          enabled?: boolean | undefined;
          clientId?: string | undefined;
          scopes?: string[] | undefined;
          clientSecret?: string | undefined;
          redirectUri?: string | undefined;
          authorizationUrl?: string | undefined;
          tokenUrl?: string | undefined;
          audiences?: string[] | undefined;
          tokenParamName?: string | undefined;
          registrationUrl?: string | undefined;
        }
      >
    >;
    authProviderType: z.ZodOptional<
      z.ZodEnum<
        [
          'dynamic_discovery',
          'google_credentials',
          'service_account_impersonation',
        ]
      >
    >;
    targetAudience: z.ZodOptional<z.ZodString>;
    targetServiceAccount: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    env?: Record<string, string> | undefined;
    command?: string | undefined;
    timeout?: number | undefined;
    description?: string | undefined;
    url?: string | undefined;
    headers?: Record<string, string> | undefined;
    extensionName?: string | undefined;
    cwd?: string | undefined;
    trust?: boolean | undefined;
    args?: string[] | undefined;
    tcp?: string | undefined;
    includeTools?: string[] | undefined;
    excludeTools?: string[] | undefined;
    httpUrl?: string | undefined;
    oauth?:
      | {
          enabled?: boolean | undefined;
          clientId?: string | undefined;
          scopes?: string[] | undefined;
          clientSecret?: string | undefined;
          redirectUri?: string | undefined;
          authorizationUrl?: string | undefined;
          tokenUrl?: string | undefined;
          audiences?: string[] | undefined;
          tokenParamName?: string | undefined;
          registrationUrl?: string | undefined;
        }
      | undefined;
    authProviderType?:
      | 'dynamic_discovery'
      | 'google_credentials'
      | 'service_account_impersonation'
      | undefined;
    targetAudience?: string | undefined;
    targetServiceAccount?: string | undefined;
  },
  {
    env?: Record<string, string> | undefined;
    command?: string | undefined;
    timeout?: number | undefined;
    description?: string | undefined;
    url?: string | undefined;
    headers?: Record<string, string> | undefined;
    extensionName?: string | undefined;
    cwd?: string | undefined;
    trust?: boolean | undefined;
    args?: string[] | undefined;
    tcp?: string | undefined;
    includeTools?: string[] | undefined;
    excludeTools?: string[] | undefined;
    httpUrl?: string | undefined;
    oauth?:
      | {
          enabled?: boolean | undefined;
          clientId?: string | undefined;
          scopes?: string[] | undefined;
          clientSecret?: string | undefined;
          redirectUri?: string | undefined;
          authorizationUrl?: string | undefined;
          tokenUrl?: string | undefined;
          audiences?: string[] | undefined;
          tokenParamName?: string | undefined;
          registrationUrl?: string | undefined;
        }
      | undefined;
    authProviderType?:
      | 'dynamic_discovery'
      | 'google_credentials'
      | 'service_account_impersonation'
      | undefined;
    targetAudience?: string | undefined;
    targetServiceAccount?: string | undefined;
  }
>;
/**
 * SDK MCP Server configuration schema
 */
export declare const SdkMcpServerConfigSchema: z.ZodObject<
  {
    type: z.ZodLiteral<'sdk'>;
    name: z.ZodString;
    instance: z.ZodType<
      {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
      },
      z.ZodTypeDef,
      {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
      }
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    type: 'sdk';
    instance: {
      connect(transport: unknown): Promise<void>;
      close(): Promise<void>;
    };
  },
  {
    name: string;
    type: 'sdk';
    instance: {
      connect(transport: unknown): Promise<void>;
      close(): Promise<void>;
    };
  }
>;
/**
 * Unified MCP Server configuration schema
 */
export declare const McpServerConfigSchema: z.ZodUnion<
  [
    z.ZodObject<
      {
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        cwd: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        httpUrl: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        tcp: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        trust: z.ZodOptional<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        includeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
        excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
        extensionName: z.ZodOptional<z.ZodString>;
        oauth: z.ZodOptional<
          z.ZodObject<
            {
              enabled: z.ZodOptional<z.ZodBoolean>;
              clientId: z.ZodOptional<z.ZodString>;
              clientSecret: z.ZodOptional<z.ZodString>;
              scopes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              redirectUri: z.ZodOptional<z.ZodString>;
              authorizationUrl: z.ZodOptional<z.ZodString>;
              tokenUrl: z.ZodOptional<z.ZodString>;
              audiences: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              tokenParamName: z.ZodOptional<z.ZodString>;
              registrationUrl: z.ZodOptional<z.ZodString>;
            },
            'strict',
            z.ZodTypeAny,
            {
              enabled?: boolean | undefined;
              clientId?: string | undefined;
              scopes?: string[] | undefined;
              clientSecret?: string | undefined;
              redirectUri?: string | undefined;
              authorizationUrl?: string | undefined;
              tokenUrl?: string | undefined;
              audiences?: string[] | undefined;
              tokenParamName?: string | undefined;
              registrationUrl?: string | undefined;
            },
            {
              enabled?: boolean | undefined;
              clientId?: string | undefined;
              scopes?: string[] | undefined;
              clientSecret?: string | undefined;
              redirectUri?: string | undefined;
              authorizationUrl?: string | undefined;
              tokenUrl?: string | undefined;
              audiences?: string[] | undefined;
              tokenParamName?: string | undefined;
              registrationUrl?: string | undefined;
            }
          >
        >;
        authProviderType: z.ZodOptional<
          z.ZodEnum<
            [
              'dynamic_discovery',
              'google_credentials',
              'service_account_impersonation',
            ]
          >
        >;
        targetAudience: z.ZodOptional<z.ZodString>;
        targetServiceAccount: z.ZodOptional<z.ZodString>;
      },
      'strip',
      z.ZodTypeAny,
      {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        timeout?: number | undefined;
        description?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        extensionName?: string | undefined;
        cwd?: string | undefined;
        trust?: boolean | undefined;
        args?: string[] | undefined;
        tcp?: string | undefined;
        includeTools?: string[] | undefined;
        excludeTools?: string[] | undefined;
        httpUrl?: string | undefined;
        oauth?:
          | {
              enabled?: boolean | undefined;
              clientId?: string | undefined;
              scopes?: string[] | undefined;
              clientSecret?: string | undefined;
              redirectUri?: string | undefined;
              authorizationUrl?: string | undefined;
              tokenUrl?: string | undefined;
              audiences?: string[] | undefined;
              tokenParamName?: string | undefined;
              registrationUrl?: string | undefined;
            }
          | undefined;
        authProviderType?:
          | 'dynamic_discovery'
          | 'google_credentials'
          | 'service_account_impersonation'
          | undefined;
        targetAudience?: string | undefined;
        targetServiceAccount?: string | undefined;
      },
      {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        timeout?: number | undefined;
        description?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        extensionName?: string | undefined;
        cwd?: string | undefined;
        trust?: boolean | undefined;
        args?: string[] | undefined;
        tcp?: string | undefined;
        includeTools?: string[] | undefined;
        excludeTools?: string[] | undefined;
        httpUrl?: string | undefined;
        oauth?:
          | {
              enabled?: boolean | undefined;
              clientId?: string | undefined;
              scopes?: string[] | undefined;
              clientSecret?: string | undefined;
              redirectUri?: string | undefined;
              authorizationUrl?: string | undefined;
              tokenUrl?: string | undefined;
              audiences?: string[] | undefined;
              tokenParamName?: string | undefined;
              registrationUrl?: string | undefined;
            }
          | undefined;
        authProviderType?:
          | 'dynamic_discovery'
          | 'google_credentials'
          | 'service_account_impersonation'
          | undefined;
        targetAudience?: string | undefined;
        targetServiceAccount?: string | undefined;
      }
    >,
    z.ZodObject<
      {
        type: z.ZodLiteral<'sdk'>;
        name: z.ZodString;
        instance: z.ZodType<
          {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
          },
          z.ZodTypeDef,
          {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
          }
        >;
      },
      'strip',
      z.ZodTypeAny,
      {
        name: string;
        type: 'sdk';
        instance: {
          connect(transport: unknown): Promise<void>;
          close(): Promise<void>;
        };
      },
      {
        name: string;
        type: 'sdk';
        instance: {
          connect(transport: unknown): Promise<void>;
          close(): Promise<void>;
        };
      }
    >,
  ]
>;
export declare const RunConfigSchema: z.ZodObject<
  {
    max_time_minutes: z.ZodOptional<z.ZodNumber>;
    max_turns: z.ZodOptional<z.ZodNumber>;
  },
  'strip',
  z.ZodTypeAny,
  {
    max_time_minutes?: number | undefined;
    max_turns?: number | undefined;
  },
  {
    max_time_minutes?: number | undefined;
    max_turns?: number | undefined;
  }
>;
export declare const SubagentConfigSchema: z.ZodObject<
  {
    name: z.ZodString;
    description: z.ZodString;
    tools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    systemPrompt: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    runConfig: z.ZodOptional<
      z.ZodObject<
        {
          max_time_minutes: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
          max_turns: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        },
        'strip',
        z.ZodTypeAny,
        {
          max_time_minutes?: number | undefined;
          max_turns?: number | undefined;
        },
        {
          max_time_minutes?: number | undefined;
          max_turns?: number | undefined;
        }
      >
    >;
    color: z.ZodOptional<z.ZodString>;
    isBuiltin: z.ZodOptional<z.ZodBoolean>;
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    description: string;
    systemPrompt: string;
    model?: string | undefined;
    tools?: string[] | undefined;
    color?: string | undefined;
    runConfig?:
      | {
          max_time_minutes?: number | undefined;
          max_turns?: number | undefined;
        }
      | undefined;
    isBuiltin?: boolean | undefined;
  },
  {
    name: string;
    description: string;
    systemPrompt: string;
    model?: string | undefined;
    tools?: string[] | undefined;
    color?: string | undefined;
    runConfig?:
      | {
          max_time_minutes?: number | undefined;
          max_turns?: number | undefined;
        }
      | undefined;
    isBuiltin?: boolean | undefined;
  }
>;
export declare const TimeoutConfigSchema: z.ZodObject<
  {
    canUseTool: z.ZodOptional<z.ZodNumber>;
    mcpRequest: z.ZodOptional<z.ZodNumber>;
    controlRequest: z.ZodOptional<z.ZodNumber>;
    streamClose: z.ZodOptional<z.ZodNumber>;
  },
  'strip',
  z.ZodTypeAny,
  {
    canUseTool?: number | undefined;
    controlRequest?: number | undefined;
    mcpRequest?: number | undefined;
    streamClose?: number | undefined;
  },
  {
    canUseTool?: number | undefined;
    controlRequest?: number | undefined;
    mcpRequest?: number | undefined;
    streamClose?: number | undefined;
  }
>;
export declare const QueryOptionsSchema: z.ZodEffects<
  z.ZodObject<
    {
      cwd: z.ZodOptional<z.ZodString>;
      model: z.ZodOptional<z.ZodString>;
      pathToQwenExecutable: z.ZodOptional<z.ZodString>;
      env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
      systemPrompt: z.ZodOptional<
        z.ZodUnion<
          [
            z.ZodString,
            z.ZodObject<
              {
                type: z.ZodLiteral<'preset'>;
                preset: z.ZodLiteral<'qwen_code'>;
                append: z.ZodOptional<z.ZodString>;
              },
              'strict',
              z.ZodTypeAny,
              {
                type: 'preset';
                preset: 'qwen_code';
                append?: string | undefined;
              },
              {
                type: 'preset';
                preset: 'qwen_code';
                append?: string | undefined;
              }
            >,
          ]
        >
      >;
      permissionMode: z.ZodOptional<
        z.ZodEnum<['default', 'plan', 'auto-edit', 'auto', 'yolo']>
      >;
      canUseTool: z.ZodOptional<
        z.ZodType<CanUseTool, z.ZodTypeDef, CanUseTool>
      >;
      mcpServers: z.ZodOptional<
        z.ZodRecord<
          z.ZodString,
          z.ZodUnion<
            [
              z.ZodObject<
                {
                  command: z.ZodOptional<z.ZodString>;
                  args: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
                  env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                  cwd: z.ZodOptional<z.ZodString>;
                  url: z.ZodOptional<z.ZodString>;
                  httpUrl: z.ZodOptional<z.ZodString>;
                  headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                  tcp: z.ZodOptional<z.ZodString>;
                  timeout: z.ZodOptional<z.ZodNumber>;
                  trust: z.ZodOptional<z.ZodBoolean>;
                  description: z.ZodOptional<z.ZodString>;
                  includeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
                  excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
                  extensionName: z.ZodOptional<z.ZodString>;
                  oauth: z.ZodOptional<
                    z.ZodObject<
                      {
                        enabled: z.ZodOptional<z.ZodBoolean>;
                        clientId: z.ZodOptional<z.ZodString>;
                        clientSecret: z.ZodOptional<z.ZodString>;
                        scopes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
                        redirectUri: z.ZodOptional<z.ZodString>;
                        authorizationUrl: z.ZodOptional<z.ZodString>;
                        tokenUrl: z.ZodOptional<z.ZodString>;
                        audiences: z.ZodOptional<
                          z.ZodArray<z.ZodString, 'many'>
                        >;
                        tokenParamName: z.ZodOptional<z.ZodString>;
                        registrationUrl: z.ZodOptional<z.ZodString>;
                      },
                      'strict',
                      z.ZodTypeAny,
                      {
                        enabled?: boolean | undefined;
                        clientId?: string | undefined;
                        scopes?: string[] | undefined;
                        clientSecret?: string | undefined;
                        redirectUri?: string | undefined;
                        authorizationUrl?: string | undefined;
                        tokenUrl?: string | undefined;
                        audiences?: string[] | undefined;
                        tokenParamName?: string | undefined;
                        registrationUrl?: string | undefined;
                      },
                      {
                        enabled?: boolean | undefined;
                        clientId?: string | undefined;
                        scopes?: string[] | undefined;
                        clientSecret?: string | undefined;
                        redirectUri?: string | undefined;
                        authorizationUrl?: string | undefined;
                        tokenUrl?: string | undefined;
                        audiences?: string[] | undefined;
                        tokenParamName?: string | undefined;
                        registrationUrl?: string | undefined;
                      }
                    >
                  >;
                  authProviderType: z.ZodOptional<
                    z.ZodEnum<
                      [
                        'dynamic_discovery',
                        'google_credentials',
                        'service_account_impersonation',
                      ]
                    >
                  >;
                  targetAudience: z.ZodOptional<z.ZodString>;
                  targetServiceAccount: z.ZodOptional<z.ZodString>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  env?: Record<string, string> | undefined;
                  command?: string | undefined;
                  timeout?: number | undefined;
                  description?: string | undefined;
                  url?: string | undefined;
                  headers?: Record<string, string> | undefined;
                  extensionName?: string | undefined;
                  cwd?: string | undefined;
                  trust?: boolean | undefined;
                  args?: string[] | undefined;
                  tcp?: string | undefined;
                  includeTools?: string[] | undefined;
                  excludeTools?: string[] | undefined;
                  httpUrl?: string | undefined;
                  oauth?:
                    | {
                        enabled?: boolean | undefined;
                        clientId?: string | undefined;
                        scopes?: string[] | undefined;
                        clientSecret?: string | undefined;
                        redirectUri?: string | undefined;
                        authorizationUrl?: string | undefined;
                        tokenUrl?: string | undefined;
                        audiences?: string[] | undefined;
                        tokenParamName?: string | undefined;
                        registrationUrl?: string | undefined;
                      }
                    | undefined;
                  authProviderType?:
                    | 'dynamic_discovery'
                    | 'google_credentials'
                    | 'service_account_impersonation'
                    | undefined;
                  targetAudience?: string | undefined;
                  targetServiceAccount?: string | undefined;
                },
                {
                  env?: Record<string, string> | undefined;
                  command?: string | undefined;
                  timeout?: number | undefined;
                  description?: string | undefined;
                  url?: string | undefined;
                  headers?: Record<string, string> | undefined;
                  extensionName?: string | undefined;
                  cwd?: string | undefined;
                  trust?: boolean | undefined;
                  args?: string[] | undefined;
                  tcp?: string | undefined;
                  includeTools?: string[] | undefined;
                  excludeTools?: string[] | undefined;
                  httpUrl?: string | undefined;
                  oauth?:
                    | {
                        enabled?: boolean | undefined;
                        clientId?: string | undefined;
                        scopes?: string[] | undefined;
                        clientSecret?: string | undefined;
                        redirectUri?: string | undefined;
                        authorizationUrl?: string | undefined;
                        tokenUrl?: string | undefined;
                        audiences?: string[] | undefined;
                        tokenParamName?: string | undefined;
                        registrationUrl?: string | undefined;
                      }
                    | undefined;
                  authProviderType?:
                    | 'dynamic_discovery'
                    | 'google_credentials'
                    | 'service_account_impersonation'
                    | undefined;
                  targetAudience?: string | undefined;
                  targetServiceAccount?: string | undefined;
                }
              >,
              z.ZodObject<
                {
                  type: z.ZodLiteral<'sdk'>;
                  name: z.ZodString;
                  instance: z.ZodType<
                    {
                      connect(transport: unknown): Promise<void>;
                      close(): Promise<void>;
                    },
                    z.ZodTypeDef,
                    {
                      connect(transport: unknown): Promise<void>;
                      close(): Promise<void>;
                    }
                  >;
                },
                'strip',
                z.ZodTypeAny,
                {
                  name: string;
                  type: 'sdk';
                  instance: {
                    connect(transport: unknown): Promise<void>;
                    close(): Promise<void>;
                  };
                },
                {
                  name: string;
                  type: 'sdk';
                  instance: {
                    connect(transport: unknown): Promise<void>;
                    close(): Promise<void>;
                  };
                }
              >,
            ]
          >
        >
      >;
      abortController: z.ZodOptional<
        z.ZodType<AbortController, z.ZodTypeDef, AbortController>
      >;
      debug: z.ZodOptional<z.ZodBoolean>;
      stderr: z.ZodOptional<
        z.ZodType<
          (message: string) => void,
          z.ZodTypeDef,
          (message: string) => void
        >
      >;
      logLevel: z.ZodOptional<z.ZodEnum<['debug', 'info', 'warn', 'error']>>;
      maxSessionTurns: z.ZodOptional<z.ZodNumber>;
      coreTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      allowedTools: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      authType: z.ZodOptional<
        z.ZodEnum<['openai', 'anthropic', 'qwen-oauth', 'gemini', 'vertex-ai']>
      >;
      agents: z.ZodOptional<
        z.ZodArray<
          z.ZodType<SubagentConfig, z.ZodTypeDef, SubagentConfig>,
          'many'
        >
      >;
      effort: z.ZodOptional<
        z.ZodEnum<['low', 'medium', 'high', 'xhigh', 'max']>
      >;
      includePartialMessages: z.ZodOptional<z.ZodBoolean>;
      continue: z.ZodOptional<z.ZodBoolean>;
      resume: z.ZodOptional<z.ZodString>;
      sessionId: z.ZodOptional<z.ZodString>;
      forkSession: z.ZodOptional<z.ZodBoolean>;
      maxToolCalls: z.ZodOptional<z.ZodNumber>;
      maxSubagentDepth: z.ZodOptional<z.ZodNumber>;
      includeDirectories: z.ZodOptional<
        z.ZodArray<z.ZodEffects<z.ZodString, string, string>, 'many'>
      >;
      extraArgs: z.ZodOptional<
        z.ZodEffects<z.ZodArray<z.ZodString, 'many'>, string[], string[]>
      >;
      extensions: z.ZodOptional<
        z.ZodArray<z.ZodEffects<z.ZodString, string, string>, 'many'>
      >;
      allowedMcpServerNames: z.ZodOptional<
        z.ZodArray<z.ZodEffects<z.ZodString, string, string>, 'many'>
      >;
      fallbackModel: z.ZodOptional<
        z.ZodArray<z.ZodEffects<z.ZodString, string, string>, 'many'>
      >;
      proxy: z.ZodOptional<z.ZodString>;
      sandbox: z.ZodOptional<z.ZodBoolean>;
      safeMode: z.ZodOptional<z.ZodBoolean>;
      insecure: z.ZodOptional<z.ZodBoolean>;
      worktree: z.ZodOptional<z.ZodBoolean>;
      disabledSlashCommands: z.ZodOptional<
        z.ZodArray<z.ZodEffects<z.ZodString, string, string>, 'many'>
      >;
      timeout: z.ZodOptional<
        z.ZodObject<
          {
            canUseTool: z.ZodOptional<z.ZodNumber>;
            mcpRequest: z.ZodOptional<z.ZodNumber>;
            controlRequest: z.ZodOptional<z.ZodNumber>;
            streamClose: z.ZodOptional<z.ZodNumber>;
          },
          'strip',
          z.ZodTypeAny,
          {
            canUseTool?: number | undefined;
            controlRequest?: number | undefined;
            mcpRequest?: number | undefined;
            streamClose?: number | undefined;
          },
          {
            canUseTool?: number | undefined;
            controlRequest?: number | undefined;
            mcpRequest?: number | undefined;
            streamClose?: number | undefined;
          }
        >
      >;
    },
    'strict',
    z.ZodTypeAny,
    {
      resume?: string | undefined;
      mcpServers?:
        | Record<
            string,
            | {
                env?: Record<string, string> | undefined;
                command?: string | undefined;
                timeout?: number | undefined;
                description?: string | undefined;
                url?: string | undefined;
                headers?: Record<string, string> | undefined;
                extensionName?: string | undefined;
                cwd?: string | undefined;
                trust?: boolean | undefined;
                args?: string[] | undefined;
                tcp?: string | undefined;
                includeTools?: string[] | undefined;
                excludeTools?: string[] | undefined;
                httpUrl?: string | undefined;
                oauth?:
                  | {
                      enabled?: boolean | undefined;
                      clientId?: string | undefined;
                      scopes?: string[] | undefined;
                      clientSecret?: string | undefined;
                      redirectUri?: string | undefined;
                      authorizationUrl?: string | undefined;
                      tokenUrl?: string | undefined;
                      audiences?: string[] | undefined;
                      tokenParamName?: string | undefined;
                      registrationUrl?: string | undefined;
                    }
                  | undefined;
                authProviderType?:
                  | 'dynamic_discovery'
                  | 'google_credentials'
                  | 'service_account_impersonation'
                  | undefined;
                targetAudience?: string | undefined;
                targetServiceAccount?: string | undefined;
              }
            | {
                name: string;
                type: 'sdk';
                instance: {
                  connect(transport: unknown): Promise<void>;
                  close(): Promise<void>;
                };
              }
          >
        | undefined;
      env?: Record<string, string> | undefined;
      proxy?: string | undefined;
      model?: string | undefined;
      maxSessionTurns?: number | undefined;
      maxToolCalls?: number | undefined;
      maxSubagentDepth?: number | undefined;
      timeout?:
        | {
            canUseTool?: number | undefined;
            controlRequest?: number | undefined;
            mcpRequest?: number | undefined;
            streamClose?: number | undefined;
          }
        | undefined;
      includeDirectories?: string[] | undefined;
      sandbox?: boolean | undefined;
      agents?: SubagentConfig[] | undefined;
      worktree?: boolean | undefined;
      extensions?: string[] | undefined;
      stderr?: ((message: string) => void) | undefined;
      authType?:
        | 'gemini'
        | 'qwen-oauth'
        | 'openai'
        | 'anthropic'
        | 'vertex-ai'
        | undefined;
      effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | undefined;
      sessionId?: string | undefined;
      cwd?: string | undefined;
      systemPrompt?:
        | string
        | {
            type: 'preset';
            preset: 'qwen_code';
            append?: string | undefined;
          }
        | undefined;
      permissionMode?:
        | 'default'
        | 'auto'
        | 'plan'
        | 'auto-edit'
        | 'yolo'
        | undefined;
      debug?: boolean | undefined;
      continue?: boolean | undefined;
      excludeTools?: string[] | undefined;
      extraArgs?: string[] | undefined;
      insecure?: boolean | undefined;
      safeMode?: boolean | undefined;
      fallbackModel?: string[] | undefined;
      includePartialMessages?: boolean | undefined;
      forkSession?: boolean | undefined;
      allowedTools?: string[] | undefined;
      coreTools?: string[] | undefined;
      disabledSlashCommands?: string[] | undefined;
      abortController?: AbortController | undefined;
      allowedMcpServerNames?: string[] | undefined;
      canUseTool?: CanUseTool | undefined;
      logLevel?: 'error' | 'warn' | 'info' | 'debug' | undefined;
      pathToQwenExecutable?: string | undefined;
    },
    {
      resume?: string | undefined;
      mcpServers?:
        | Record<
            string,
            | {
                env?: Record<string, string> | undefined;
                command?: string | undefined;
                timeout?: number | undefined;
                description?: string | undefined;
                url?: string | undefined;
                headers?: Record<string, string> | undefined;
                extensionName?: string | undefined;
                cwd?: string | undefined;
                trust?: boolean | undefined;
                args?: string[] | undefined;
                tcp?: string | undefined;
                includeTools?: string[] | undefined;
                excludeTools?: string[] | undefined;
                httpUrl?: string | undefined;
                oauth?:
                  | {
                      enabled?: boolean | undefined;
                      clientId?: string | undefined;
                      scopes?: string[] | undefined;
                      clientSecret?: string | undefined;
                      redirectUri?: string | undefined;
                      authorizationUrl?: string | undefined;
                      tokenUrl?: string | undefined;
                      audiences?: string[] | undefined;
                      tokenParamName?: string | undefined;
                      registrationUrl?: string | undefined;
                    }
                  | undefined;
                authProviderType?:
                  | 'dynamic_discovery'
                  | 'google_credentials'
                  | 'service_account_impersonation'
                  | undefined;
                targetAudience?: string | undefined;
                targetServiceAccount?: string | undefined;
              }
            | {
                name: string;
                type: 'sdk';
                instance: {
                  connect(transport: unknown): Promise<void>;
                  close(): Promise<void>;
                };
              }
          >
        | undefined;
      env?: Record<string, string> | undefined;
      proxy?: string | undefined;
      model?: string | undefined;
      maxSessionTurns?: number | undefined;
      maxToolCalls?: number | undefined;
      maxSubagentDepth?: number | undefined;
      timeout?:
        | {
            canUseTool?: number | undefined;
            controlRequest?: number | undefined;
            mcpRequest?: number | undefined;
            streamClose?: number | undefined;
          }
        | undefined;
      includeDirectories?: string[] | undefined;
      sandbox?: boolean | undefined;
      agents?: SubagentConfig[] | undefined;
      worktree?: boolean | undefined;
      extensions?: string[] | undefined;
      stderr?: ((message: string) => void) | undefined;
      authType?:
        | 'gemini'
        | 'qwen-oauth'
        | 'openai'
        | 'anthropic'
        | 'vertex-ai'
        | undefined;
      effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | undefined;
      sessionId?: string | undefined;
      cwd?: string | undefined;
      systemPrompt?:
        | string
        | {
            type: 'preset';
            preset: 'qwen_code';
            append?: string | undefined;
          }
        | undefined;
      permissionMode?:
        | 'default'
        | 'auto'
        | 'plan'
        | 'auto-edit'
        | 'yolo'
        | undefined;
      debug?: boolean | undefined;
      continue?: boolean | undefined;
      excludeTools?: string[] | undefined;
      extraArgs?: string[] | undefined;
      insecure?: boolean | undefined;
      safeMode?: boolean | undefined;
      fallbackModel?: string[] | undefined;
      includePartialMessages?: boolean | undefined;
      forkSession?: boolean | undefined;
      allowedTools?: string[] | undefined;
      coreTools?: string[] | undefined;
      disabledSlashCommands?: string[] | undefined;
      abortController?: AbortController | undefined;
      allowedMcpServerNames?: string[] | undefined;
      canUseTool?: CanUseTool | undefined;
      logLevel?: 'error' | 'warn' | 'info' | 'debug' | undefined;
      pathToQwenExecutable?: string | undefined;
    }
  >,
  {
    resume?: string | undefined;
    mcpServers?:
      | Record<
          string,
          | {
              env?: Record<string, string> | undefined;
              command?: string | undefined;
              timeout?: number | undefined;
              description?: string | undefined;
              url?: string | undefined;
              headers?: Record<string, string> | undefined;
              extensionName?: string | undefined;
              cwd?: string | undefined;
              trust?: boolean | undefined;
              args?: string[] | undefined;
              tcp?: string | undefined;
              includeTools?: string[] | undefined;
              excludeTools?: string[] | undefined;
              httpUrl?: string | undefined;
              oauth?:
                | {
                    enabled?: boolean | undefined;
                    clientId?: string | undefined;
                    scopes?: string[] | undefined;
                    clientSecret?: string | undefined;
                    redirectUri?: string | undefined;
                    authorizationUrl?: string | undefined;
                    tokenUrl?: string | undefined;
                    audiences?: string[] | undefined;
                    tokenParamName?: string | undefined;
                    registrationUrl?: string | undefined;
                  }
                | undefined;
              authProviderType?:
                | 'dynamic_discovery'
                | 'google_credentials'
                | 'service_account_impersonation'
                | undefined;
              targetAudience?: string | undefined;
              targetServiceAccount?: string | undefined;
            }
          | {
              name: string;
              type: 'sdk';
              instance: {
                connect(transport: unknown): Promise<void>;
                close(): Promise<void>;
              };
            }
        >
      | undefined;
    env?: Record<string, string> | undefined;
    proxy?: string | undefined;
    model?: string | undefined;
    maxSessionTurns?: number | undefined;
    maxToolCalls?: number | undefined;
    maxSubagentDepth?: number | undefined;
    timeout?:
      | {
          canUseTool?: number | undefined;
          controlRequest?: number | undefined;
          mcpRequest?: number | undefined;
          streamClose?: number | undefined;
        }
      | undefined;
    includeDirectories?: string[] | undefined;
    sandbox?: boolean | undefined;
    agents?: SubagentConfig[] | undefined;
    worktree?: boolean | undefined;
    extensions?: string[] | undefined;
    stderr?: ((message: string) => void) | undefined;
    authType?:
      | 'gemini'
      | 'qwen-oauth'
      | 'openai'
      | 'anthropic'
      | 'vertex-ai'
      | undefined;
    effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | undefined;
    sessionId?: string | undefined;
    cwd?: string | undefined;
    systemPrompt?:
      | string
      | {
          type: 'preset';
          preset: 'qwen_code';
          append?: string | undefined;
        }
      | undefined;
    permissionMode?:
      | 'default'
      | 'auto'
      | 'plan'
      | 'auto-edit'
      | 'yolo'
      | undefined;
    debug?: boolean | undefined;
    continue?: boolean | undefined;
    excludeTools?: string[] | undefined;
    extraArgs?: string[] | undefined;
    insecure?: boolean | undefined;
    safeMode?: boolean | undefined;
    fallbackModel?: string[] | undefined;
    includePartialMessages?: boolean | undefined;
    forkSession?: boolean | undefined;
    allowedTools?: string[] | undefined;
    coreTools?: string[] | undefined;
    disabledSlashCommands?: string[] | undefined;
    abortController?: AbortController | undefined;
    allowedMcpServerNames?: string[] | undefined;
    canUseTool?: CanUseTool | undefined;
    logLevel?: 'error' | 'warn' | 'info' | 'debug' | undefined;
    pathToQwenExecutable?: string | undefined;
  },
  {
    resume?: string | undefined;
    mcpServers?:
      | Record<
          string,
          | {
              env?: Record<string, string> | undefined;
              command?: string | undefined;
              timeout?: number | undefined;
              description?: string | undefined;
              url?: string | undefined;
              headers?: Record<string, string> | undefined;
              extensionName?: string | undefined;
              cwd?: string | undefined;
              trust?: boolean | undefined;
              args?: string[] | undefined;
              tcp?: string | undefined;
              includeTools?: string[] | undefined;
              excludeTools?: string[] | undefined;
              httpUrl?: string | undefined;
              oauth?:
                | {
                    enabled?: boolean | undefined;
                    clientId?: string | undefined;
                    scopes?: string[] | undefined;
                    clientSecret?: string | undefined;
                    redirectUri?: string | undefined;
                    authorizationUrl?: string | undefined;
                    tokenUrl?: string | undefined;
                    audiences?: string[] | undefined;
                    tokenParamName?: string | undefined;
                    registrationUrl?: string | undefined;
                  }
                | undefined;
              authProviderType?:
                | 'dynamic_discovery'
                | 'google_credentials'
                | 'service_account_impersonation'
                | undefined;
              targetAudience?: string | undefined;
              targetServiceAccount?: string | undefined;
            }
          | {
              name: string;
              type: 'sdk';
              instance: {
                connect(transport: unknown): Promise<void>;
                close(): Promise<void>;
              };
            }
        >
      | undefined;
    env?: Record<string, string> | undefined;
    proxy?: string | undefined;
    model?: string | undefined;
    maxSessionTurns?: number | undefined;
    maxToolCalls?: number | undefined;
    maxSubagentDepth?: number | undefined;
    timeout?:
      | {
          canUseTool?: number | undefined;
          controlRequest?: number | undefined;
          mcpRequest?: number | undefined;
          streamClose?: number | undefined;
        }
      | undefined;
    includeDirectories?: string[] | undefined;
    sandbox?: boolean | undefined;
    agents?: SubagentConfig[] | undefined;
    worktree?: boolean | undefined;
    extensions?: string[] | undefined;
    stderr?: ((message: string) => void) | undefined;
    authType?:
      | 'gemini'
      | 'qwen-oauth'
      | 'openai'
      | 'anthropic'
      | 'vertex-ai'
      | undefined;
    effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | undefined;
    sessionId?: string | undefined;
    cwd?: string | undefined;
    systemPrompt?:
      | string
      | {
          type: 'preset';
          preset: 'qwen_code';
          append?: string | undefined;
        }
      | undefined;
    permissionMode?:
      | 'default'
      | 'auto'
      | 'plan'
      | 'auto-edit'
      | 'yolo'
      | undefined;
    debug?: boolean | undefined;
    continue?: boolean | undefined;
    excludeTools?: string[] | undefined;
    extraArgs?: string[] | undefined;
    insecure?: boolean | undefined;
    safeMode?: boolean | undefined;
    fallbackModel?: string[] | undefined;
    includePartialMessages?: boolean | undefined;
    forkSession?: boolean | undefined;
    allowedTools?: string[] | undefined;
    coreTools?: string[] | undefined;
    disabledSlashCommands?: string[] | undefined;
    abortController?: AbortController | undefined;
    allowedMcpServerNames?: string[] | undefined;
    canUseTool?: CanUseTool | undefined;
    logLevel?: 'error' | 'warn' | 'info' | 'debug' | undefined;
    pathToQwenExecutable?: string | undefined;
  }
>;
