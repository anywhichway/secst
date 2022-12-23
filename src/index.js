import JSON5 from "json5";
import {HighlightJS} from "highlight.js";
import {init as initEmojiMart, SearchIndex } from "emoji-mart";
import {listeners} from "./listeners.js";
import {updateValueWidths} from "./update-value-widths.js";
import {stringTemplateEval} from "./string-template-eval.js";
import {resolve} from "./resolve.js";
import {resolveDataTemplate} from "./resolve-data-template.js";
import {engage, init} from "@anywhichway/autohelm";
import {toTagSpecs} from "./to-tag-specs.js";
import {patchAutohelm} from "./patch-autohelm.js";

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
        patchAutohelm();
        window.addEventListener("hashchange",() => {
            const header = document.getElementById("secst-header");
            header.scrollIntoView()
        })
    })
}

window.JSON5 = JSON5;
window.autohelm = {
    init,
    engage
}
window.patchAutohelm = patchAutohelm;
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
    resolveDataTemplate,
    tagSpecs: await (async () => {
        const {allTags} = await import("./tags/all-tags.js");
        return await toTagSpecs(allTags);
    })()
}

