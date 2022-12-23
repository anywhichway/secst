import textContent from "./text-content.js";

const toc = {
    htmlDocLink: "",
    contentAllowed: true,
    attributesAllowed: {
        "data-toggle": true,
        toggle() {
            return {
                "data-toggle": ""
            }
        }
    },
    transform(node) {
        node.tag = "h1";
        if (!node.classList.includes("toc")) {
            node.classList.push("toc");
        }
        if (node.content.length === 0) {
            node.content = ["Table of Contents"]
        }
        return node;
    }
}

export {toc,toc as default}