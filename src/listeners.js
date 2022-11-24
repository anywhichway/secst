import {extractValue} from "./extract-value.js";
import {resolveDataTemplate} from "./resolve-data-template.js";
import {formatValue} from "./format-value.js";

const listeners = {
    change(event) {
        const template = event.target.getAttribute("data-template");
        if(event.target.tagName==="INPUT" && template!==null && (event.target.value+"")!=="[object Promise]") {
            if(event.target.type==="checkbox") {
                if(event.target.value!==event.target.checked+"") {
                    event.target.value = event.target.checked+"";
                }
            } else {
                event.target.rawValue = extractValue(event.target);
                event.target.setAttribute("data-template", event.target.rawValue);
                const value = formatValue(event.target);
                if(event.target.value!==value) {
                    event.target.value = formatValue(event.target);
                    if( event.target.hasAttribute("data-autosize")) {
                        event.target.style.width = Math.min(80,Math.max(1,event.target.value.length+1))+"ch";
                    }
                }
            }
            [...event.target.dependents||[]].forEach(async (el) => {
                el.rawValue = await resolveDataTemplate(document.body,el.getAttribute("data-template"));
                const value = formatValue(el);
                if(el.value!==value) {
                    el.value = formatValue(el);
                    if(el.hasAttribute("data-autosize")) {
                        el.style.width = Math.min(80,Math.max(1,el.value.length+1))+"ch";
                    }
                }
            })
        }
    },
    click() {
        if(event.target.tagName==="INPUT" && event.target.type==="checkbox") {
            if(event.target.value!==event.target.checked+"") {
                event.target.value = event.target.checked+"";
            }
        }
    },
    input(event) {
        const template = event.target.getAttribute("data-template");
        if(event.target.tagName==="INPUT" && template!==null) {
            event.target.rawValue = extractValue(event.target);
            event.target.setAttribute("data-template", event.target.rawValue);
            event.target.value = formatValue(event.target);
            if( event.target.hasAttribute("data-autosize")) {
                event.target.style.width = Math.min(80,Math.max(1,event.target.value.length+1))+"ch";
            }
            event.target.style.width = Math.min(80,Math.max(1,event.target.value.length+1))+"ch";
            [...event.target.dependents||[]].forEach(async (el) => {
                el.rawValue = await resolveDataTemplate(document.body,el.getAttribute("data-template"));
                const value = formatValue(el);
                if(el.value !== value) {
                    el.value = value;
                    if(el.hasAttribute("data-autosize")) {
                        el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
                    }
                }
            })
        }
    }
}

export {listeners}