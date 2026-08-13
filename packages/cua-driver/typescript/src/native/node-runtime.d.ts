declare const _default: {
    FfiType: {
        UInt8: {
            tag: string;
        };
        Int8: {
            tag: string;
        };
        UInt16: {
            tag: string;
        };
        Int16: {
            tag: string;
        };
        UInt32: {
            tag: string;
        };
        Int32: {
            tag: string;
        };
        UInt64: {
            tag: string;
        };
        Int64: {
            tag: string;
        };
        Float32: {
            tag: string;
        };
        Float64: {
            tag: string;
        };
        Handle: {
            tag: string;
        };
        RustBuffer: {
            tag: string;
        };
        ForeignBytes: {
            tag: string;
        };
        RustCallStatus: {
            tag: string;
        };
        VoidPointer: {
            tag: string;
        };
        Void: {
            tag: string;
        };
        Callback: (name: string) => {
            tag: string;
            name: string;
        };
        Struct: (name: string) => {
            tag: string;
            name: string;
        };
        Reference: (inner: unknown) => {
            tag: string;
            inner: unknown;
        };
        MutReference: (inner: unknown) => {
            tag: string;
            inner: unknown;
        };
    };
    resolveLibPath: any;
    UniffiNativeModule: unknown;
};
export default _default;
