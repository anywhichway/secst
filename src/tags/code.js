import {HighlightJS} from "highlight.js";
import Tag from "../tag.js";
import {updateValueWidths} from "../update-value-widths.js";

const code = {
    attributesAllowed: {
        disabled: true,
        readonly: true,
        language: true, // todo validate with list
    },
    contentAllowed: true,
    transform(node) {
        const language = node.attributes.language;
        if (language!=null) {
            if(language==="none") {
               node.classList.push("nohighlight");
            } else {
                node.classList.push(`language-${language}`);
            }
        } else {
            node.classList.push("nohighlight");
        }
        delete node.attributes.language;
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
           return new Tag({tag:"pre",content:[node],options:{classList:["secst"]}})
        }
        return node;
    },
    mounted(el,node) {
        if(!node.classList.includes("nohighlight")) {
            HighlightJS.highlightElement(el);
            if(!node.content[0].includes("\n")) {
                el.style.backgroundColor = "unset";
            }
        }
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
delete code.contentAllowed.code;

export {code,code as default}