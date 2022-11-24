import {resolveDataTemplate} from "./resolve-data-template.js";
import {formatValue} from "./format-value.js";

const resolve = async (node=document.body,ifNull) => {
    if(!window.secstObserver) {
        window.secstObserver = new MutationObserver(function(mutations) {
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
    const valueEls = [...node.querySelectorAll("input[data-template]")];
    for(const el of valueEls) {
        const template = el.getAttribute("data-template");
        try {
            el.rawValue = resolveDataTemplate(node,template,el).then((value) => {
                el.rawValue = value;
                if(value===template) {
                    el.removeAttribute("disabled");
                } else {
                    el.setAttribute("disabled",""); // the value was a computation
                }
                el.setAttribute("value",value=formatValue(el));
                if(el.hasAttribute("data-autosize")) {
                    el.style.width = Math.min(80,Math.max(1,value.length+2))+"ch";
                }
            });
            await el.rawValue; // awaiting after the assignment prevent getting stuck in an Inifnite wait due to recursive resolves
        } catch(e) {

        }
    }
};

export {resolve}