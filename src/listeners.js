import {extractValue} from "./extract-value.js";
import {resolveDataTemplate} from "./resolve-data-template.js";
import {formatValue} from "./format-value.js";

const update = async (target) => {
    if(target.type==="checkbox") {
        if(target.value!==target.checked+"") {
            target.value = target.checked+"";
        }
    } else {
        target.rawValue = extractValue(target);
        target.setAttribute("data-template", target.rawValue);
        const value = formatValue(target);
        if(target.value!==value) {
            target.value = value;
            target.setAttribute("value",value); // both are needed, or Chrome breaks
        }
    }
    for(const el of [...target.dependents||[]]) {
        el.rawValue = await resolveDataTemplate(document.body,el.getAttribute("data-template"));
        const value = formatValue(el);
        if(el.value!==value) {
            el.value = value;
            el.setAttribute("value",value); // both are needed, or Chrome breaks
        }
    }
}

const updateWidths = () => {
    requestAnimationFrame(() => {
        [...document.querySelectorAll('input[data-fitcontent]')].forEach((el) => {
            const value = el.getAttribute("value")||"";
            el.style.width = Math.min(80,Math.max(1,value.length+1))+"ch";
        })
    })
}

const listeners = {
    async change(event) {
        const template = event.target.getAttribute("data-template");
        if(event.target.tagName==="INPUT" && template!==null && (event.target.value+"")!=="[object Promise]") {
            await update(event.target);
            updateWidths();
        }
    },
    click(event) {
        if(event.target.tagName==="INPUT" && event.target.type==="checkbox") {
            if(event.target.value!==event.target.checked+"") {
                event.target.value = event.target.checked+"";
            }
        }
    },
    async input(event) {
        if(event.target.tagName==="INPUT" && event.target.getAttribute("data-template")!==null) {
           await update(event.target);
           updateWidths();
        }
    }
}

export {listeners}