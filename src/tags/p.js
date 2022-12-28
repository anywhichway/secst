import Tag from "../tag.js";
import phrasingContent from "./phrasing-content.js";
import sanitizeCSS from "../sanitize-css.js";

const p = {
    attributesAllowed: {
        style(value) {
            try {
                const o = JSON.parse(value),
                    div = document.createElement("div");
                div.setAttribute("style","");
                Object.entries(o).forEach(([key,value]) => {
                    div.style[key] = value;
                });
                value = div.getAttribute("style");
            } catch(e) {
                // ignore
            }
            const css = sanitizeCSS(`p {${value}}`)
            return {
                style: css.substring(css.indexOf("{")+1,css.lastIndexOf("}")).trim()
            }
        },
        align:["left","right"],
        textAlign:["left","center","right","justify"]
    },
    stringsAllowed: true,
    contentAllowed: {
        ...phrasingContent
    },
    transform(node) {
        node.content = node.content.reduce((content,item,i) => {
            if(typeof(item)==="string") {
                if(i===0 && item.startsWith("\r\n")) {
                    item = item.substring(2);
                }
                const lines = item.split("\r\n");
                if(lines.length>0) {
                    lines.forEach((line,lnum) => {
                        if((lnum>0 && line.length===0) || lnum>0) {
                            content.push(new Tag({tag:"br"}));
                        }
                        if(line.length>0) {
                            content.push(line);
                        }
                    })
                }

            } else if(p.contentAllowed[item.tag]) {
                content.push(item);
            }
            return content;
        },[])
        return node;
    },
    mounted(el,node) {
        if(node.attributes.align!=null) {
            el.style.float = node.attributes.align;
            el.removeAttribute("align")
        }
        if(node.attributes.textAlign!=null) {
            el.style.textAlign = node.attributes.textAlign;
            delete node.attributes.textAlign;
            el.removeAttribute("textalign")
        }
    }
}

export {p, p as default}