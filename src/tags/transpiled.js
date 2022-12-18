import {HighlightJS} from "highlight.js";
import Tag from "../tag.js";

const transpiled = {
    async contentAllowed() {
        const {flowContent} = await import("./flow-content.js"),
            {bodyContent} = await import("./body-content.js");
        return this.contentAllowed = {
            ...flowContent,
            ...bodyContent
        }
    },
    beforeConnect(node) {
        node.tag = "div";
        return node;
    },
    mounted(el) {
        let html = el.innerHTML;
        const trimmed = html.trimLeft(),
            space = html.length - trimmed.length;
        if(space>0) { // remove left spaces to equal indent of first line
            html = html.split("\n").map((line) => {
                let count = 0;
                while (count<space && ["\t", " "].includes(line[count])) {
                    count++;
                }
                return line.substring(count);
            }).join("\n").trim();
        }
        const pre = document.createElement("pre"),
            code = document.createElement("code");
        pre.classList.add("secst");
        code.innerHTML =  HighlightJS.highlight(html,{language:"html"}).value;
        code.classList.add("hljs");
        code.classList.add("language-html");
        pre.appendChild(code);
        el.replaceWith(pre);
    },
    requires: [
        {
            tag: "link",
            attributes: {
                rel: "stylesheet",
                href: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/styles/default.min.css"
            }
        }
    ]
}

export {transpiled,transpiled as default}