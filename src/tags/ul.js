import Tag from "../tag.js";
import li from "./li.js"
import forEach from "./for-each.js";
import forEntries from "./for-entries.js";

const ul = {
    attributesAllowed: {
        title:"string"
    },
        contentAllowed: {
            forEach,
            forEntries,
            li
        },
        transform(node) {
            let currentli;
            node.content = node.content.reduce((content,item) => {
                if(typeof(item)==="string") {
                    const lines = item.split("\n");
                    lines.forEach((line,i) => {
                        if(line.trim().length===0) {
                            return;
                        }
                        if(line.match(/\s*-/)) {
                            line = line.trimLeft().substring(1);
                            if(!currentli || currentli.content.length>0) {
                                currentli = new Tag({tag:"li",content:[]});
                                content.push(currentli);
                            }
                            if(line.length>0) {
                                currentli.content.push(line);
                            }
                        } else if(!currentli) {
                            currentli ||= new Tag({tag: "li", content: [line]});
                            content.push(currentli);
                        } else {
                            currentli.content.push(line);
                        }
                    })
                } else if(item.tag!=="li") {
                    if(!currentli) {
                        currentli = new Tag({tag:"li",content:[]});
                        content.push(currentli);
                    }
                    currentli.content.push(item);
                } else {
                    currentli = item;
                    content.push(item);
                }
                return content;
            },[])
            return node;
        }
    }

export {ul,ul as default}