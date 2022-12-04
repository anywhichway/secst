import {transform} from "./transform.js";
import {listeners} from "./listeners.js";
import {resolve} from "./resolve.js";
import {engage} from "@anywhichway/autohelm";

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
            document.body.addEventListener(key,value);
        });
        engage(".toc")
        resolve();
    })
}

window.SECST = {
    transform,
    resolve,
    listeners
}

