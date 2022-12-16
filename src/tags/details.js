import Tag from "../tag.js";
import phrasingContent from "./phrasing-content.js";
import textContent from "./text-content.js";

const details = {
    contentAllowed: {
        summary: {
            contentAllowed:{...textContent}
        },
        ...phrasingContent
    },
    transform(node) {
        if(node.content[0].tag!=="summary") {
            const parts = node.content[0].split(" ");
            node.content.unshift(
                new Tag({
                    tag:"summary",
                    content:[parts.shift()]
                })
            );
            node.content[1] = parts.join(" ");
        }
        return node;
    }
}

export {details,details as default}