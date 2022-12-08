import {extractValue} from "./extract-value.js";
import {resolveDataTemplate} from "./resolve-data-template.js";
import {formatValue} from "./format-value.js";
import {updateValueWidths} from "./update-value-widths.js";

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
            if(target.tagName==="TEXTAREA") {
                target.innerHTML = value;
                const lines = value.split("\n");
                el.style.height = (Math.min(20,lines.length)*1.5) + "em";
                el.style.width = Math.min(80,lines.reduce((len,line) => Math.max(len,line.length),0)) + "ch";
            } else {
                target.setAttribute("value",value); // both .value and attribute are needed, or Chrome breaks
            }
        }
    }
    for(const el of [...target.dependents||[]]) {
        el.rawValue = await resolveDataTemplate(document.body,el.getAttribute("data-template"));
        const value = formatValue(el);
        if(el.value!==value) {
            el.value = value;
            if(el.tagName==="TEXTAREA") {
                el.innerHTML = value;
                if(el.hasAttribute("fitcontent")) {
                    const lines = value.split("\n");
                    el.style.height = (Math.min(20, lines.length) * 1.5) + "em";
                    el.style.width = Math.min(80, lines.reduce((len, line) => Math.max(len, line.length), 0)) + "ch";
                }
            } else {
                el.setAttribute("value",value); // both .value and attribute are needed, or Chrome breaks
            }
        }
    }
}

const listeners = {
    async change(event) {
        if(["INPUT","TEXTAREA"].includes(event.target.tagName) && event.target.getAttribute("data-template")!==null && (event.target.value+"")!=="[object Promise]") {
            await update(event.target);
            updateValueWidths();
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
        if(["INPUT","TEXTAREA"].includes(event.target.tagName) && event.target.getAttribute("data-template")!==null) {
           await update(event.target);
           updateValueWidths();
        }
    },
    resize() {
        updateValueWidths();
    }
}

export {listeners}