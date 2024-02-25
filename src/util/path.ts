export const template_path = "template";
export const resolve_path = (separator="/", root="/") => (...join: string[]) => root + join.join(separator);