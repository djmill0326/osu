export const array_iter = (input, offset=0, reverse=false) => {
    // evil branchless, probably slower than just branching
    const factor = reverse * 2 - 1;
    const x = reverse ? input.length - offset - 1 : offset;
    let index = 0;
    return () => input[x - index++ * factor];
};

export const kv_iter = (input, offset=0, reverse=false) => 
    array_iter(Object.keys(input).map(key => ({ key, value: input[key] })), offset, reverse);

export const rev = (f) => 
    (input, offset=0) => f(input, offset, true);

const config_simple = () => {
    const name_name = "_name";
    const data_name = "_data";
    const config = Object.create({
        _sanitize: function(feature) {
            return feature === name_name || feature === this[name_name] || feature === this[name_name] + data_name;
        },
        _get_getter: function() {
            return this[this[name_name]];
        },
        _get_storage: function() {
            return this[this[name_name] + data_name];
        },
        test: function(feature) {
            return !!this._get_getter()[feature];
        },
        get: function(feature) {
            if (feature && (feature.length || feature.toString)) {
                if (this._sanitize(feature)) return null;
                return this.test(feature) ? this._get_storage()[feature] : null;
            }
            return null;
        },
        dump: function() {
            const dump = {};
            Object.keys(this._get_storage()).forEach(x => {
                if (this._sanitize(x)) return;
                dump[x] = this.get(x);
            });
            return dump;
        },
        enable: function(feature, value, update_if_enabled=false) {
            if (this._sanitize(feature) || (!update_if_enabled && this.test(feature))) return;
            this._get_getter()[feature] = true;
            this._get_storage()[feature] = value;
        },
        disable: function(feature) {
            if(this._sanitize() || !this.test(feature)) return;
            this._get_getter()[feature] = false;
            delete this.get_storage()[feature];
        },
        if_enabled: function(feature, f) {
            return this.test(feature) ? f(feature, this) : null;
        },
        update: function(feature, value, enable_if_nonexistent=false) {
            if (enable_if_nonexistent || this.test(feature)) {
                this.enable(feature, value, true);
                return true;
            } else return false;
        },
        pluck: function(...features) {
            let feature_list = features;
            if (features.length === 1) {
                if (typeof features[0] === "string") {
                    if (!this.test(features[0])) return {};
                    const conf = this.get(features[0]);
                    const why = {};
                    why[features[0]] = conf;
                    return why;
                } else if (features[0].length) {
                    feature_list = features[0];
                }
            }
            if (feature_list.length === 0) return {};
            const why = {};
            feature_list.forEach(feature => this.if_enabled(feature, () => why[feature] = this.get(feature)));
            return why;
        }
    });
    config[name_name] = "_evil_do_not_touch";
    config[config[name_name]] = {};
    config[config[name_name] + data_name] = {};
    return Object.seal(config);
};

export const build_accumulator = (iterator, config=config_simple()) => {
    config.enable("iterator", iterator);
    config.enable("accumulator", )
    return config;
};

export const with_accumulator = (next, extend=()=>[]) => {
    const pre = extend(); // i'll waste some clock cycles for once
    const proto = pre.push ? pre : [];
    for (let x; x = next(); proto.push(x));
    return proto;
};

export const with_accumulator_transformed = (next, f, extend=()=>[]) => {
    const pre = extend(); // i'll waste some clock cycles for once
    const proto = pre.push ? pre : [];
    for (let x; x = next(); proto.push(f(x)));
    return proto;
};

export const with_accumulator_conditional = (next, f, condition, extend) => {
    const pre = extend(); // i'll waste some clock cycles for once
    const proto = pre.push ? pre : [];
    for (let x; x = next(); f(x) ? proto.push(x) : null);
    return proto;
};

export const map = (next, f=(x)=>x, extend) => with_accumulator(next, f, extend);

export const filter = (next, f=(x)=>Boolean(x), extend) => {
    for (let x; x = next(); f(x) ? proto.push(x) : null);
    return proto;
}

export const reduce = (next, f=(a,b)=>a+b, proto=[]) => {

}

export const lazy = (next, f=x=>x) => 
    () => new Promise((resolve, reject) => {
        const x = next();
        if (x) resolve(f(x));
        else reject("iterator failed to yield");
    });

export const lazy_run = (lazy, on_next=()=>{}, on_finish=()=>{}, init=()=>({})) => {
    const data = init();
    const promise = new Promise(async (resolve) => {
        let x = true;
        while(x) {
            x = await lazy().catch(x => on_finish(x, data));
            x ? on_next(x, data) : null;
        }
        resolve(data);
    });
    return promise;
};

export const lazy_collect = (lazy, accumulator=(x, data) => data.arr.push(x)) => 
    lazy_run(lazy, accumulator, ()=>{}, ()=>({ arr: [] })).then(x => x.arr);
