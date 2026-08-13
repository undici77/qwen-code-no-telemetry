import { atom } from 'jotai';
export const NEW_SESSION_DRAFT_ID = '__new_session_draft__';
export const newSessionDraftAtom = atom({
    nonce: 0,
    input: '',
    createOptions: {},
});
//# sourceMappingURL=new-session-draft.js.map