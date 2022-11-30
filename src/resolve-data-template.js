import replaceAsync from "string-replace-async";
import XRegExp from "xregexp";
const AsyncFunction = (async function () {}).constructor;
import {formatValue} from "./format-value.js";
import {stringTemplateEval} from "./string-template-eval.js";

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
    if(selector.endsWith("[]")) {
        expectsArray = true;
        els = [...root.querySelectorAll(selector)].filter((el) => {
            if(el.tagName==="INPUT" && el.hasAttribute("data-template")) {
                return true;
            }
        });
    } else {
        const el = root.querySelector(selector);
        if(el.tagName==="INPUT" && el.hasAttribute("data-template")) {
            els = [el];
        }
    }
    for(const el of els) {
        el.dependents ||= new Set();
        if(requestor) el.dependents.add(requestor);
        if(el.rawValue==null) {
            el.rawValue = "";
        }
        if(el.value==="" || !requestor) {
            el.rawValue = await resolveDataTemplate(root,el.getAttribute("data-template"),el);
            const formatted = formatValue(el);
            el.value = formatted;
            if(el.tagName==="TEXTAREA") {
                el.innerHTML = formatted;
                if(el.hasAttribute("data-fitcontent")) {
                    const lines = el.value.split("\n");
                    el.style.height = (Math.min(20, lines.length) * 1.5) + "em";
                    el.style.width = Math.min(80, lines.reduce((len, line) => Math.max(len, line.length), 0)) + "ch";
                }
            } else {
                el.setAttribute("value",formatted);
                if(el.hasAttribute("data-fitcontent")) {
                    el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
                }
            }
        }
    }
    const result = expectsArray ? els.map(el => el.rawValue) : els[0].rawValue
    return result && typeof(result)==="object" && !(result instanceof Promise) ? JSON.stringify(result) : result===undefined ? "" : result;
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
                    const value = selector==="document.data" ? {...document.data||{}} : await valueOf(root,selector,requestor),
                        type = typeof(value);
                    if(type==="string") {
                        return "`" + value + "`";
                    }
                    if(value && type==="object") {
                        if(selector==="document.data") {
                            delete value.urls; // really big and should not need in worker
                        }
                        const text = JSON.stringify(value);
                        if(bracketAdded && text.endsWith("]")) { // a HACK because matchRecursive drops the last "]"
                            return text.substring(0,text.length-1);
                        }
                        return text;
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
    if(typeof(Worker)==="function") {
        const result =  await stringTemplateEval("${" + text + "}"),
            type = typeof(result);
        if(result && type==="object" && result.stringTemplateError) {
            throw new Error(result.stringTemplateError);
        }
        return result && type==="object" ? JSON.stringify(result) : result;
    } else {
        return (new AsyncFunction("return `${" + text + "}`"))();
    }
}

export {resolveDataTemplate}