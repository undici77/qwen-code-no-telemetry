import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { saveWorkflowScript, validateWorkflowName, } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../hooks/useKeypress.js';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
export const WorkflowSaveOverlay = ({ script, initialName = '', config, isActive, onClose, }) => {
    const [name, setName] = useState(initialName);
    const [scope, setScope] = useState('project');
    const [phase, setPhase] = useState('edit');
    const [message, setMessage] = useState('');
    // Live (non-blocking) name validation, shown under the field while editing.
    const liveNameError = name.length > 0 ? validateWorkflowName(name) : null;
    const doSave = async (overwrite) => {
        setPhase('saving');
        try {
            const result = await saveWorkflowScript(config, {
                name,
                scope,
                script,
                overwrite,
            });
            switch (result.status) {
                case 'saved':
                    setMessage(result.path);
                    setPhase('saved');
                    break;
                case 'exists':
                    setMessage(result.path);
                    setPhase('overwrite');
                    break;
                case 'invalid-name':
                case 'empty-script':
                    setMessage(result.error);
                    setPhase('error');
                    break;
                default:
                    break;
            }
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : String(e));
            setPhase('error');
        }
    };
    useKeypress((key) => {
        if (phase === 'saving')
            return; // ignore keystrokes mid-write
        if (phase === 'saved') {
            onClose(name); // any key dismisses; tell the parent what was saved
            return;
        }
        if (phase === 'error') {
            setPhase('edit'); // any key returns to editing to fix the name
            setMessage('');
            return;
        }
        if (phase === 'overwrite') {
            if (key.name === 'return' || key.sequence === 'y') {
                void doSave(true);
                return;
            }
            setPhase('edit'); // Esc / n / anything else backs out
            return;
        }
        // phase === 'edit'
        if (key.name === 'escape') {
            onClose();
            return;
        }
        if (key.name === 'return') {
            const err = !name
                ? 'Workflow name is required.'
                : validateWorkflowName(name);
            if (err) {
                setMessage(err);
                setPhase('error');
                return;
            }
            void doSave(false);
            return;
        }
        if (key.name === 'tab') {
            setScope((s) => (s === 'project' ? 'user' : 'project'));
            return;
        }
        if (key.name === 'backspace' || key.name === 'delete') {
            setName((n) => n.slice(0, -1));
            return;
        }
        if (key.ctrl && key.name === 'u') {
            setName('');
            return;
        }
        // Printable single char → append. Out-of-range chars are accepted but
        // surface the live validation hint; submission re-validates.
        if (!key.ctrl &&
            !key.meta &&
            key.sequence.length === 1 &&
            key.sequence >= ' ') {
            setName((n) => n + key.sequence);
        }
    }, { isActive });
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, paddingX: 1, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Save workflow') }), phase === 'overwrite' ? (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.status.warning, children: t('{{name}}.js already exists in {{scope}} scope.', {
                            name,
                            scope,
                        }) }), _jsx(Text, { color: theme.text.secondary, children: t('Overwrite? Enter / y to confirm · any other key cancels') })] })) : phase === 'saved' ? (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.status.success, children: t('Saved to {{path}}', { path: message }) }), _jsx(Text, { color: theme.text.secondary, children: t('Available as /{{name}} on the next session · press any key', {
                            name,
                        }) })] })) : phase === 'error' ? (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.status.error, children: message }), _jsx(Text, { color: theme.text.secondary, children: t('Press any key to edit the name') })] })) : (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { children: [t('name'), '  : ', name, _jsx(Text, { color: theme.text.accent, children: '█' }), !name && (_jsx(Text, { color: theme.text.secondary, children: t('(type a name)') }))] }), _jsxs(Text, { children: [t('scope'), ' : ', _jsx(Text, { bold: scope === 'project', color: scope === 'project' ? theme.text.accent : theme.text.secondary, children: t('project') }), '   ', _jsx(Text, { bold: scope === 'user', color: scope === 'user' ? theme.text.accent : theme.text.secondary, children: t('user') })] }), liveNameError && (_jsx(Text, { color: theme.status.error, children: liveNameError })), _jsx(Text, { color: theme.text.secondary, children: t('Enter save · Tab scope · Esc cancel') })] }))] }));
};
//# sourceMappingURL=workflow-save-overlay.js.map