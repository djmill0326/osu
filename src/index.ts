import { resolve_path, template_path } from "./util/path.js";
import {} from "./util/functional.js";

const default_fetch = (path: string, override={}) => fetch(path, { mode: "same-origin", method: "GET", ...override });
const fetch_text = (path: string, override={}) => default_fetch(path, override).then(response => response.text());
const fetch_json = (path: string, override={}) => default_fetch(path, override).then(response => response.json());

const get_path = resolve_path();

const exec_regex = (re: RegExp, string: string) => {
    const matches: RegExpMatchArray[] = [];
    for (let match = re.exec(string); match; match = re.exec(string)) matches.push(match);
    return matches;
};

const load_template = async (path: string) => {
    const dir = path.split(".");
    const name = dir[dir.length - 2];
    const ext = dir[dir.length - 1];
    const template = await fetch_text(get_path(template_path, ext, path));
    const template_vars = await fetch_json(get_path(template_path, "json", `${name}.json`));

    const vars = exec_regex(/\$([a-z_]+)/gim, template);
    let prev_index = 0;
    const new_template = vars.map(match => {
        const substring = template.substring(prev_index, match.index);
        prev_index = match.index as number + match[0].length;
        return { substring, tag: match[1] };
    });
    new_template.push({
        substring: template.substring(prev_index, template.length),
        tag: null as unknown as string
    });

    console.info(`loaded template '${path}'`);
    console.debug(new_template);
    return new_template;
};

const template_loaders: Map<string, ReturnType<typeof load_template>> = new Map();
template_loaders.set("hitcircle", load_template("hitcircle.svg"));

const template_root = document.createElement("template");
document.body.append(template_root);

const templates = Object.keys(template_loaders).map(async (key) => {
    const el = document.createElement("svg");
    template_root.append(el);
    const template = await template_loaders.get(key);
    console.log(template);
    return el;
});

// evil async defeating
console.log("all templates:\n", await Promise.all(templates));