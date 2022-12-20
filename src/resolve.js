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
    const valueEls = [...node.querySelectorAll("[data-template]")];
    for(const el of valueEls) {
        const template = el.getAttribute("data-template"),
            tagName = el.tagName;
        try {
            el.rawValue = resolveDataTemplate(node,template,el).then(async (value) => {
                el.rawValue = value;
                const formatted = await formatValue(el,value);
                if(["INPUT","TEXTAREA"].includes(tagName)) {
                    el.value = formatted;
                    if((value==template && !el.hasAttribute("data-literal")) || el.hasAttribute("data-editable")) { // used relaxed equality because results may be numbers
                        el.removeAttribute("disabled");
                    } else {
                        el.setAttribute("disabled",""); // the value was a computation
                    }
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
                            el.style.width = Math.min(80,Math.max(1,value.length+1))+"ch";
                        }
                    }
                } else {
                    el.innerText = formatted;
                }
            });
            await el.rawValue; // awaiting after the assignment prevent getting stuck in an Inifnite wait due to recursive resolves
        } catch(e) {
            //console.error(e);
        }
    }
};

export {resolve}