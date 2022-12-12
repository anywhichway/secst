import replaceAsync from "string-replace-async";
import XRegExp from "xregexp";
import JSON5 from "json5";
const AsyncFunction = (async function () {}).constructor;
import {formatValue} from "./format-value.js";
import {stringTemplateEval} from "./string-template-eval.js";
import {updateValueWidths} from "./update-value-widths.js";

const validateSelector = (selector) => {
    try {
        document.createDocumentFragment().querySelector(selector)
    } catch {
        return;
    }
    return selector;
};

const valueOf = async (root,selector,requestor) => {
    let els,
        expectsArray;
    if(selector.endsWith("[]") || selector.includes(",")) {
        expectsArray = true;
        els = [...root.querySelectorAll(selector)].filter((el) => {
            if(["INPUT","TEXTAREA"].includes(el.tagName) && el.hasAttribute("data-template")) {
                return true;
            }
        });
    } else {
        els = [root.querySelector(selector)];
        if(els[0]==null) {
            return els[0]
        }
    }
    for(const el of els) {
        el.dependents ||= new Set();
        if(requestor) el.dependents.add(requestor);
        if(el.rawValue==null) {
            el.rawValue = "";
        }
        if(["INPUT","TEXTAREA"].includes(el.tagName)) {
            if(el.value==="" || !requestor) {
                const template = el.getAttribute("data-template");
                el.rawValue = await resolveDataTemplate(root,template,el);
            }
            const formatted = formatValue(el);
            el.value = formatted;
            if(el.tagName==="TEXTAREA") {
                el.innerHTML = formatted;
                if(el.hasAttribute("data-fitcontent")) {
                    updateValueWidths([el]);
                }
            } else {
                el.setAttribute("value",formatted);
                if(el.hasAttribute("data-fitcontent")) {
                    updateValueWidths([el]);
                }
            }
        } else {
            try {
                el.rawValue = JSON5.parse(el.innerText)
            } catch(e) {
                el.rawValue = el.innerText;
            }
        }
    }
    const result = expectsArray ? els.map(el => el.rawValue) : els[0].rawValue
    return result && typeof(result)==="object" && !(result instanceof Promise) ? result : result===undefined ? "" : result; // JSON.stringify(result)
}

const replaceReferences = async (root,string,requestor) => {
    if(string.includes("$(")) {
        for(const match of XRegExp.matchRecursive(string, '\\$\\(', '\\)', 'g',{unbalanced:"skip"})) {
            string = await replaceAsync(string,new RegExp(`\\$\\((${XRegExp.escape(match)})\\)`,"g"),async (match,selector) => {
                let bracketAdded;
                if(selector.endsWith("[")) {
                    selector += "]";
                    bracketAdded = true;
                }
                try {
                    let value = selector==="document.data" ? {...document.data||{}} : await valueOf(root,selector,requestor),
                        type = typeof(value);
                    if(type==="string") {
                        try {
                            value = JSON5.parse(value);
                            type = typeof(value);
                        } catch(e) {

                        }
                        if(type==="string") {
                            return "`" + value + "`";
                        }
                    }
                    if(value && type==="object") {
                        if(selector==="document.data") {
                            delete value.urls; // really big and should not need in worker
                        }
                        let text = value;
                        if(bracketAdded && text.endsWith("]")) { // a HACK because matchRecursive drops the last "]"
                            text = text.substring(0,text.length-1);
                        }
                        return "(" + JSON.stringify(text) + ")";
                    }
                    return value;
                } catch(e) {
                    return match;
                }
            })
        }
    }
    return string;
}

const resolveDataTemplate = async (root,string,requestor) => {
    if(!string) return;
    const text = await replaceReferences(root,string,requestor);
    if(requestor?.hasAttribute("data-literal")) {
        return text;
    } else if(typeof(Worker)==="function") {
        let result =  await stringTemplateEval("${" + text + "}"),
            type = typeof(result);
        if(result && type==="object" && result.stringTemplateError) {
            if(requestor) throw new Error(result.stringTemplateError);
            return "";
        }
        if(type==="string") {
            try {
                result = JSON5.parse(result);
                type = typeof(result);
            } catch(e) {

            }
        }
        return result && type==="object" ? JSON.stringify(result,null,2) : result;
    } else {
        return (new AsyncFunction("return `${" + text + "}`"))();
    }
}

export {resolveDataTemplate}