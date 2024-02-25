function haha<A, B>(a: A, b: B) {
    // i'm only doing this because I don't lik-TypeScript is very awesome
    // ReturnType<typeof haha<A, B>> = A & B
    return { ...a, ...b };
}

function object_create<Proto, Type>(proto: Proto, addl: Type) {
    const object_a = Object.create(proto as object);
    Object.keys(addl as any).forEach(k => object_a[k] = (addl as any)[k]);
    return object_a as ReturnType<typeof haha<Proto, Type>>; // Proto + Type
}

function object_seal<T>(obj: T) {
    return Object.seal(obj as object) as Readonly<T>;
}

export const config_simple = () => {
    const name_name = "_name";
    const data_name = "_data";
    const proto = {
        _sanitize: function(feature: string) {
            return feature === name_name || feature === (this as any)[name_name] || feature === (this as any)[name_name] + data_name;
        },
        _get_getter: function() {
            return (this as any)[(this as any)[name_name]] as Record<string, boolean>;
        },
        _get_storage: function() {
            return (this as any)[(this as any)[name_name] + data_name] as Record<string, any>;
        },
        test: function(feature: string) {
            return !!this._get_getter()[feature];
        },
        get: function(feature: string): any|null {
            if (feature && feature.length) {
                if (this._sanitize(feature)) return null;
                return this.test(feature) ? this._get_storage()[feature] : null;
            }
            return null;
        },
        dump: function() {
            const dump = {} as Record<string, any>;
            Object.keys(this._get_storage()).forEach(x => {
                if (this._sanitize(x)) return;
                dump[x] = this.get(x);
            });
            return dump;
        },
        enable: function(feature: string, value: any, update_if_enabled=false) {
            if (this._sanitize(feature) || (!update_if_enabled && this.test(feature))) return;
            this._get_getter()[feature] = true;
            this._get_storage()[feature] = value;
        },
        disable: function(feature: string) {
            if(this._sanitize(feature) || !this.test(feature)) return;
            this._get_getter()[feature] = false;
            delete this._get_storage()[feature];
        },
        if_enabled: function<T>(feature: string, f: (feature: string) => T) {
            return this.test(feature) ? f(feature) : null;
        },
        update: function(feature: string, value: any, enable_if_nonexistent=false) {
            if (enable_if_nonexistent || this.test(feature)) {
                this.enable(feature, value, true);
                return true;
            } else return false;
        },
        pluck: function(...features: string[]) {
            let feature_list = features;
            if (features.length === 1) {
                if (typeof features[0] === "string") {
                    if (!this.test(features[0])) return {};
                    const conf = this.get(features[0]);
                    const why = {} as Record<string, any>;
                    why[features[0]] = conf;
                    return why;
                } else if ((features[0] as []).length) {
                    feature_list = features[0];
                }
            }
            if (feature_list.length === 0) return {};
            const why = {} as Record<string, any>;
            feature_list.forEach(feature => this.if_enabled(feature, () => why[feature] = this.get(feature)));
            return why;
        }
    };
    const config = object_create(proto, { 
        name_name, 
        [name_name]: {} as Record<string, boolean>, 
        [name_name + data_name]: {} as Record<string, any> 
    });
    return object_seal(config);
};

export default config_simple;