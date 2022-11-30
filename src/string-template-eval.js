import QuickWorker from "@anywhichway/quick-worker";

const stringTemplateEval = async (stringTemplate,requestor) => {
    if(!stringTemplateEval.evaluator) {
        stringTemplateEval.evaluator = await QuickWorker({
            properties: {
                document: {
                    data: Object.entries(document.data||{}).reduce((data, [key, value]) => {
                        if (key !== "urls") {
                            data[key] = value;
                        }
                        return data;
                    }, {}),
                    baseURI: document.baseURI
                },
                evaluate: async (stringTemplate) => { // remember this function can't use closures, it is passed to the worker as a string
                    // todo add table formatter
                    const ul = (data = {}, format = (data) => data && typeof (data) === "object" ? JSON.stringify(data) : data) => {
                            return "<ul>" + Object.values(data).reduce((items,item) => items += ("<li>" + format(item) + "</li>\n"),"") + "</ul>"
                        },
                        ol = (data = {}, format = (data) => data && typeof (data) === "object" ? JSON.stringify(data) : data) => {
                            return "<ol>" + Object.values(data).reduce((items,item) => items += ("<li>" + format(item) + "</li>\n"),"") + "</ol>"
                        },
                        solve = (formula, args) => {
                            formula = formula+"";// MathJS sends in an object that stringifies to the forumla
                            Object.entries(args).forEach(([variable, value]) => {
                                formula = formula.replaceAll(new RegExp(variable, "g"), value);
                            })
                            return new Function("return " + formula)();
                        },
                        functions = {
                            ul,
                            ol,
                            solve
                        }
                    try {
                        const AsyncFunction = (async ()=>{}).constructor;
                        return await (new AsyncFunction("functions", "math", "globalThis", "with(functions) { with(math) { return `" + stringTemplate + "`}}")).call(null, functions, self.math); //always 2 args so globalThis is undefined
                    } catch (e) {
                        return {stringTemplateError: e + ""}
                    }
                },
            },
            timeout:1000,
            imports:['https://cdn.jsdelivr.net/npm/mathjs@11.3.2/lib/browser/math.min.js']})
    }
    return (await stringTemplateEval.evaluator.evaluate)(stringTemplate);
}

export {stringTemplateEval}