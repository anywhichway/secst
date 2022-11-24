import replaceAsync from "string-replace-async";
const AsyncFunction = (async function () {}).constructor;
import {formatValue} from "./format-value.js";

const resolveDataTemplate = async (root,string,requestor) => {
    if(!string) return;
    const text = await replaceAsync(string,/\$\(([^)]*)\)/g,async (match,selector) => {
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
                el.setAttribute("value",formatValue(el));
                if(el.hasAttribute("data-autosize")) {
                    el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
                }
            }
        }
        const result = expectsArray ? els.map(el => el.rawValue) : els[0].rawValue
        return result && typeof(result)==="object" && !(result instanceof Promise) ? JSON.stringify(result) : result;
    });
    return (new AsyncFunction("return `${" + text + "}`"))();
}

export {resolveDataTemplate}