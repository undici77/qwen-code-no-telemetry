export function shouldRunElectronAsNode(command, args) {
    return (!!process.versions.electron &&
        command === process.execPath &&
        !!args[0]?.endsWith('.js'));
}
export function withElectronRunAsNodeEnv(env, command, args) {
    if (!shouldRunElectronAsNode(command, args))
        return env;
    return {
        ...env,
        ELECTRON_RUN_AS_NODE: '1',
    };
}
//# sourceMappingURL=electron-run-as-node.js.map