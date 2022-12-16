import phrasingContent from "./phrasing-content.js";

const escape = {
    contentAllowed: true,
    beforeMount(node) {
        if(node.content[0]?.includes("\n")) {
            const text = node.content[0],
                trimmed = text.trimLeft(),
                space = text.length - trimmed.length;
            if(space>0) { // remove left spaces to equal indent of first line
                node.content[0] = text.split("\n").map((line) => {
                    let count = 0;
                    while (count<space && ["\t", " "].includes(line[count])) {
                        count++;
                    }
                    return line.substring(count);
                }).join("\n").trim();
            }
            node.tag = "div";
            node.classList.push("secst-pre-line");
        } else {
            node.tag = "span";
        }
        return node;
    }
}
delete escape.contentAllowed.escape;

export {escape,escape as default}