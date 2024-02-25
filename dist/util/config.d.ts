export declare const config_simple: () => Readonly<{
    _sanitize: (feature: string) => boolean;
    _get_getter: () => Record<string, boolean>;
    _get_storage: () => Record<string, any>;
    test: (feature: string) => boolean;
    get: (feature: string) => any | null;
    dump: () => Record<string, any>;
    enable: (feature: string, value: any, update_if_enabled?: boolean) => void;
    disable: (feature: string) => void;
    if_enabled: <T>(feature: string, f: (feature: string) => T) => T | null;
    update: (feature: string, value: any, enable_if_nonexistent?: boolean) => boolean;
    pluck: (...features: string[]) => Record<string, any>;
} & {
    [x: string]: string | Record<string, any>;
    name_name: string;
    _name: Record<string, boolean>;
}>;
export default config_simple;
