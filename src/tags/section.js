import blockContent from "./block-content.js";
import {macro as MACRO} from "./macro.js";
import Tag from "../tag.js";

const section = {
    attributesAllowed:{
        level:"number"
    },
    stringAllowed: true,
    contentAllowed: {
        ...blockContent,
        macro: MACRO
    },
    transform(node,{level}) {
        const pconfig = section.contentAllowed.p;
        if(node.attributes.level>0) {
            level = node.attributes.level;
        }
        let p;
         node.content = [...node.content.reduce((content,item,i) => {
             if (typeof (item) === "string") {
                 const paragraphs = item.split("\r\n\r\n");
                 if (paragraphs.length > 1) {
                     paragraphs.forEach((paragraph, i) => {
                         if (i === 0 && p) {
                             p.content.push(paragraph);
                         } else {
                             content.add(p = new Tag({tag: "p", content: [paragraph]}))
                         }
                     })
                 } else {
                     p ||= new Tag({tag: "p", level});
                     p.content.push(item);
                 }
             } else if (pconfig.contentAllowed[item.tag]) {
                 p ||= new Tag({tag: "p", level});
                 p.content.push(item);
             } else if (section.contentAllowed[item.tag]) {
                 content.add(item);
                 p = new Tag({tag: "p", level});
             } else if(MACRO.macros.has(item.tag)) {
                const macro = MACRO.macros.get(item.tag);
                content.add(MACRO.resolve(macro,item));
             } else {
                 throw new TypeError(`Unexpected content in section: ${item}`);
                 //console.log("err")
             }
            if(p) {
                content.add(p);
            }
            return content;
        },new Set())].filter((item) => {
            return item.tag!=="p" || item.content.length>1 || (item.content.length>0 && (typeof(item.content[0])!=="string" || item.content[0].trim().length>0));
         });
        return node;
    }
}


export {section,section as default}