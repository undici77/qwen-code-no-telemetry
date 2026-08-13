/**
 * Centralized branding configuration.
 *
 * Supports multiple brand presets (e.g. "qwen-code", "openwork").
 * Select at runtime via the CRAFT_BRAND environment variable.
 * Default: "qwen-code" (backward-compatible).
 */
// ---------------------------------------------------------------------------
// Brand presets
// ---------------------------------------------------------------------------
const QWEN_CODE_BRAND = {
    id: 'qwen-code',
    appName: 'Qwen Code Desktop',
    appId: 'com.alibaba.qwen-code',
    productName: 'Qwen Code Desktop',
    artifactPrefix: 'Qwen-Code-Desktop',
    copyright: 'Copyright © 2026 Alibaba Group.',
    coAuthorLine: 'Co-Authored-By: Qwen Code <agents-noreply@craft.do>',
    selfReferName: 'Qwen Code',
    viewerUrl: 'https://agents.craft.do',
    updates: {
        provider: 'generic',
        url: 'https://github.com/QwenLM/qwen-code/releases/download/desktop-latest',
        releasePageUrl: 'https://github.com/QwenLM/qwen-code/releases',
    },
    helpMenuLinks: [
        {
            labelKey: 'menu.homepage',
            url: 'https://qwen.ai/qwencode',
            icon: 'House',
        },
    ],
    assets: {
        resourceDir: 'resources/brands/qwen-code',
        rendererSymbol: 'resources/brands/qwen-code/icon.svg',
        macIcon: 'resources/brands/qwen-code/icon.icns',
        winIcon: 'resources/brands/qwen-code/icon.ico',
        linuxIcon: 'resources/brands/qwen-code/icon.png',
        devDockIcon: 'resources/brands/qwen-code/dock.png',
        iconSvg: 'resources/brands/qwen-code/icon.svg',
        liquidGlassAssetsCar: 'resources/brands/qwen-code/Assets.car',
    },
    credits: '',
    creditsShort: '',
    creditsEntries: [],
};
const BRANDS = {
    'qwen-code': QWEN_CODE_BRAND,
    openwork: {
        id: 'openwork',
        appName: 'OpenWork',
        appId: 'com.alibaba.openwork',
        productName: 'OpenWork',
        artifactPrefix: 'OpenWork',
        copyright: 'Copyright © 2026 Alibaba Group.',
        coAuthorLine: 'Co-Authored-By: OpenWork <noreply@alibaba.com>',
        selfReferName: 'OpenWork',
        viewerUrl: 'https://agents.craft.do',
        updates: {
            provider: 'github',
            owner: 'modelstudioai',
            repo: 'openwork',
            releasePageUrl: 'https://github.com/modelstudioai/openwork/releases',
        },
        helpMenuLinks: [
            {
                labelKey: 'menu.homepage',
                url: 'https://github.com/modelstudioai/openwork',
                icon: 'House',
            },
        ],
        assets: {
            resourceDir: 'resources/brands/openwork',
            rendererSymbol: 'resources/brands/openwork/symbol.png',
            macIcon: 'resources/brands/openwork/icon.icns',
            winIcon: 'resources/brands/openwork/icon.png',
            linuxIcon: 'resources/brands/openwork/icon.png',
            devDockIcon: 'resources/brands/openwork/dock.png',
            liquidGlassAssetsCar: 'resources/brands/openwork/Assets.car',
        },
        credits: 'Architecture: craft-agents-oss | Agent: Qwen Code',
        creditsShort: 'Based on craft-agents-oss & Qwen Code',
        creditsEntries: [
            {
                name: 'Qwen Code',
                role: 'AI Agent Engine',
                url: 'https://github.com/QwenLM/qwen-code',
            },
            {
                name: 'Craft Agents OSS',
                role: 'Desktop Architecture',
                url: 'https://github.com/craft-ai-agents/craft-agents-oss',
            },
        ],
    },
};
/** Active brand, selected by CRAFT_BRAND env var (default: "qwen-code"). */
export const BRAND = BRANDS[process.env.CRAFT_BRAND || 'qwen-code'] ?? QWEN_CODE_BRAND;
// ---------------------------------------------------------------------------
// App version (renderer-safe — avoids the version barrel which pulls in Node deps)
// ---------------------------------------------------------------------------
import pkg from '../package.json';
/** Application version from package.json (safe for renderer/browser use). */
export const APP_VERSION = pkg.version;
// ---------------------------------------------------------------------------
// Legacy exports (unchanged, still used by OAuth callback pages etc.)
// ---------------------------------------------------------------------------
export const CRAFT_LOGO = [
    '  ████████ █████████    ██████   ██████████ ██████████',
    '██████████ ██████████ ██████████ █████████  ██████████',
    '██████     ██████████ ██████████ ████████   ██████████',
    '██████████ ████████   ██████████ ███████      ██████  ',
    '  ████████ ████  ████ ████  ████ █████        ██████  ',
];
/** Logo as a single string for HTML templates */
export const CRAFT_LOGO_HTML = CRAFT_LOGO.map((line) => line.trimEnd()).join('\n');
/** Session viewer base URL */
export const VIEWER_URL = BRAND.viewerUrl;
//# sourceMappingURL=branding.js.map