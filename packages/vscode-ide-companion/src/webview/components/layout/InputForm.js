import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { InputForm as BaseInputForm, getEditModeIcon } from '@qwen-code/webui';
import { getApprovalModeInfoFromString } from '../../../types/acpTypes.js';
import { ModelSelector } from './ModelSelector.js';
/**
 * Convert ApprovalModeValue to EditModeInfo
 */
const getEditModeInfo = (editMode) => {
    const info = getApprovalModeInfoFromString(editMode);
    return {
        label: info.label,
        title: info.title,
        icon: info.iconType ? getEditModeIcon(info.iconType) : null,
    };
};
/**
 * InputForm with ApprovalModeValue and ModelSelector support
 *
 * This is an adapter that accepts the local ApprovalModeValue type
 * and converts it to webui's EditModeInfo format.
 * It also renders the ModelSelector component when needed.
 */
export const InputForm = ({ editMode, showModelSelector, availableModels, currentModelId, onSelectModel, onCloseModelSelector, ...rest }) => {
    const editModeInfo = getEditModeInfo(editMode);
    return (_jsxs(_Fragment, { children: [showModelSelector && onSelectModel && onCloseModelSelector && (_jsx("div", { className: "fixed bottom-[120px] left-4 right-4 z-[1001] max-w-[600px] mx-auto", children: _jsx(ModelSelector, { visible: showModelSelector, models: availableModels ?? [], currentModelId: currentModelId ?? null, onSelectModel: onSelectModel, onClose: onCloseModelSelector }) })), _jsx(BaseInputForm, { editModeInfo: editModeInfo, ...rest })] }));
};
//# sourceMappingURL=InputForm.js.map