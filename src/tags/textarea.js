import textContent from "./text-content.js";
import {updateValueWidths} from "../update-value-widths.js";

const textarea = {
    contentAllowed:true,
    attributesAllowed: {
        disabled: true,
        value: true,
        readonly: true
    },
    render(node,el) {
        el.innerHTML = node.attributes.value || node.content[0];
        updateValueWidths([el]);
    },
    transform(node) {
        node.content = [node.content.join("\n")];
        return node;
    }
}

export {textarea,textarea as default}