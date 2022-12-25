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
                        },
                        AsyncFunction = (async ()=>{}).constructor;
                    //debugger;
                    try { // try as math expression
                        const result = await (new AsyncFunction("functions", "math", "globalThis", "with(functions) { with(math) { return math.evaluate(\"" + stringTemplate + "\") }}")).call(null, functions, self.math); //always 3  args so globalThis is undefined
                        return result ? (result._data ? result._data : ((typeof(result.isOperatorNode)!=="undefined" || (result.units && result.toSI)) ? result.toString() : result)) : result;
                    } catch (e) {
                        try { // try as JavaScript expression
                            const result = await (new AsyncFunction("functions", "math", "globalThis", "with(functions) { with(math) { return " + stringTemplate + "}}")).call(null, functions, self.math);
                            return result ? (result._data ? result._data : ((typeof(result.isOperatorNode)!=="undefined" || (result.units && result.toSI)) ? result.toString() : result)) : result;
                        } catch(e) {
                            return {stringTemplateError: e + ""}
                        }
                    }
                },
            },
            timeout:100000,
            imports:['https://cdn.jsdelivr.net/npm/mathjs@11.3.2/lib/browser/math.min.js','https://cdn.jsdelivr.net/npm/json5@2.2.1/dist/index.min.js']})
    }
    return (await stringTemplateEval.evaluator.evaluate)(stringTemplate);
}

export {stringTemplateEval}