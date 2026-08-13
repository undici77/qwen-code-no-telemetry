import { jsx as _jsx } from "react/jsx-runtime";
import { BRAND } from '@craft-agent/shared/branding';
const brandSymbols = import.meta.glob('../../../../resources/brands/*/{symbol.png,icon.svg}', {
    eager: true,
    import: 'default',
});
export function CraftAgentsSymbol({ className }) {
    return (_jsx("img", { src: brandSymbols[`../../../../${BRAND.assets.rendererSymbol}`], alt: BRAND.appName, className: className, draggable: false }));
}
//# sourceMappingURL=CraftAgentsSymbol.js.map