import Tag from "../tag.js";
import li from "./li.js"

const ol = {
    indirectChildAllowed: true,
    attributesAllowed: {
        reversed: true,
        start(value) {
            if (parseInt(value) !== value) {
                throw new TypeError(`${value} must be a number`)
            }
        },
        type(value) {
            if (!("aAiI1".includes(value) && value.length === 1)) {
                throw new TypeError(`Attribute "type" must be one of these letters: aAiI1`)
            }
        }
    },
    contentAllowed: {
        li: li
    },
    transform(node) {
        node.content = node.content.reduce((content,item) => {
            if(typeof(item)==="string") {
                const lines = item.split("\n");
                let listitem = "";
                lines.forEach((line,i) => {
                    line = line.trim();
                    if(line.length===0) return;
                    const num = parseInt(line),
                        nl = i<lines.length-1 ? "\n" : "";
                    if(typeof(num)==="number" && !isNaN(num)) {
                        line = line.substring((num+".").length);
                        if(num!==1 && node.attributes.start==null) {
                            node.attributes.start = num;
                        }
                        if(listitem.length>0) {
                            content.push({tag:"li",content:[listitem]});
                            listitem = line + nl;
                        } else {
                            listitem += line + nl;
                        }
                    } else if(line.startsWith("- ")) {
                        line = line.substring(2);
                        if(listitem.length>0) {
                            content.push({tag:"li",content:[listitem]});
                            listitem = line + nl;
                        } else {
                            listitem += line + nl;
                        }
                    } else {
                        listitem += line + nl;
                    }
                })
                if(listitem.length>0) {
                    content.push({tag:"li",content:[listitem]});
                }
            } else {
                content.push(item);
            }
            return content;
        },[])
        return node;
    }
}

export {ol,ol as default}