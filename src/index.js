import JSON5 from "json5";
import {HighlightJS} from "highlight.js";
import katex from "katex";
import mhchem from "katex/dist/contrib/mhchem.mjs";
import {init as initEmojiMart, SearchIndex } from "emoji-mart";
import {listeners} from "./listeners.js";
import {updateValueWidths} from "./update-value-widths.js";
import {stringTemplateEval} from "./string-template-eval.js";
import {resolve} from "./resolve.js";
import {resolveDataTemplate} from "./resolve-data-template.js";
import {engage, init} from "@anywhichway/autohelm";

if(document.currentScript?.getAttribute("src").endsWith("?run")) {
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
    document.addEventListener("DOMContentLoaded",()=> {
        Object.entries(listeners).forEach(([key,value]) => {
            window.addEventListener(key,value);
        });
        engage(".toc");
        resolve();
        updateValueWidths();
    })
}

window.JSON5 = JSON5;
window.katex = katex;
window.autohelm = {
    init,
    engage
}
window.emojiMart = {
    init: initEmojiMart,
    SearchIndex
}
window.HighlightJS = HighlightJS;
window.SECST = {
    resolve,
    listeners,
    updateValueWidths,
    stringTemplateEval,
    resolveDataTemplate
}

