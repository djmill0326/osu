import { resolve_path, template_path } from "./path.js";
const default_fetch = (path, override = {}) => fetch(path, Object.assign({ mode: "same-origin", method: "GET" }, override));
const fetch_text = (path, override = {}) => default_fetch(path, override).then(response => response.text());
const fetch_json = (path, override = {}) => default_fetch(path, override).then(response => response.json());
const get_path = resolve_path();
const exec_regex = (re, string) => {
    const matches = [];
    for (let match = re.exec(string); match; match = re.exec(string))
        matches.push(match);
    return matches;
};
const load_template = async (path) => {
    const dir = path.split(".");
    const name = dir[dir.length - 2];
    const ext = dir[dir.length - 1];
    const template = await fetch_text(get_path(template_path, ext, path));
    const template_vars = await fetch_json(get_path(template_path, "json", `${name}.json`));
    const vars = exec_regex(/\$([a-z_]+)/gim, template);
    let prev_index = 0;
    const new_template = vars.map(match => {
        const substring = template.substring(prev_index, match.index);
        prev_index = match.index + match[0].length;
        return { substring, postfix: match[1] };
    });
    new_template.push({
        substring: template.substring(prev_index, template.length),
        postfix: null
    });
    console.info(`loaded template '${path}'`);
    console.debug(new_template);
    return new_template;
};
const template_loaders = {
    hitcircle: load_template("hitcircle.svg")
};
const template_root = document.createElement("template");
document.body.append(template_root);
const templates = Object.keys(template_loaders).map(async (key) => {
    const el = document.createElement("svg");
    template_root.append(el);
    el.outerHTML = await template_loaders[key];
    return el;
});
// evil async defeating
console.log("all templates:\n", await Promise.all(templates));
