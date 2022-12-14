import JSON5 from "json5";
import {listeners} from "./listeners.js";
import {updateValueWidths} from "./update-value-widths.js";
import {resolve} from "./resolve.js";
import {engage} from "@anywhichway/autohelm";
import {stringTemplateEval} from "./string-template-eval.js";

window.SECST = {
    stringTemplateEval
}

window.JSON5 = JSON5;
//if(document.currentScript?.getAttribute("src").endsWith("?run")) {

    document.addEventListener("DOMContentLoaded",()=> {
        Object.entries(listeners).forEach(([key,value]) => {
            window.addEventListener(key,value);
        });
        engage(".toc");
        resolve();
        updateValueWidths();
        window.addEventListener("hashchange",() => {
            const header = document.getElementById("secst-header");
            header.scrollIntoView()
        });
        if(typeof(window)==="object" && typeof(MutationObserver)=="function") {
            window.secstObserver ||= new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    const target = mutation.target;
                    if (mutation.type === "attributes") {
                        const event = new Event("attributeChanged");
                        event.attributeName = mutation.attributeName;
                        event.attributeNamespace = mutation.attributeNamespace;
                        event.oldValue = mutation.oldValue;
                        event.value = target.getAttribute(event.attributeName);
                        target.dispatchEvent(event);
                    } else if(mutation.type==="childList") {
                        [...mutation.removedNodes].forEach((el) => {
                            const event = new Event("disconnected");
                            el.dispatchEvent(event);
                        })
                    }
                });
            });
        }
    })
//}




