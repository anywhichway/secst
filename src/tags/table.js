import Tag from "../tag.js";
import caption from "./caption.js";

const td = {
    attributesAllowed: {
        colspan(value) {
            if(parseInt(value)!==value+"") {
                throw new TypeError("must be a numebr");
            }
        }
    },
    async contentAllowed() {
        const {phrasingContent} = await import("./phrasing-content.js");
        return this.contentAllowed = {...phrasingContent}
    }
}

const th =  {
    attributesAllowed: {
        colspan(value) {
            if(parseInt(value)!==value+"") {
                throw new TypeError("must be a numebr");
            }
        }
    },
    async contentAllowed() {
        const {phrasingContent} = await import("./phrasing-content.js");
        return this.contentAllowed = {...phrasingContent}
    }
}

const tr = {
    attributesAllowed: {
        rowspan(value) {
            if(parseInt(value)!==value+"") {
                throw new TypeError("must be a number")
            }
        }
    },
    contentAllowed: {
        td,
        th
    },
    transform(node) {
        const line = [];
        node.content.forEach((item,i,content) => {
            if(typeof(item)==="string") {
                const items = item.split("|").map((item) => item.trim());
                for(let i=0;i<items.length;i++) {
                    if(items[i]==="") {
                        if(typeof(items[i+1])==="string") {
                            line.push(items[i]);
                        }
                    } else {
                        line.push(items[i]);
                    }
                }
            } else {
                line.push(item);
            }
        });
        node.content = line.map((item) => {
            if(typeof(item)==="string") return {tag:"td", content:[item]};
            return item;
        })
        return node;
    }
}

const table = {
    contentAllowed: {
        tbody: {
            contentAllowed: {
                tr
            }
        },
        tfoot: {
            contentAllowed: "*"
        },
        thead: {
            contentAllowed: {
                tr
            },
            transform(node) {
                if(node.content.length===1 && typeof(node.content[0])==="string") {
                    const row = tr.transform(new Tag({tag:"tr",content:[node.content[0]]}));
                    row.content = row.content.map((td) => {td.tag = "th"; return td;});
                    node.content[0] = row;
                }
                return node;
            }
        },
        caption,
        tr
    },
    transform(node) {
        node.classList.push("secst");
        return node;
        // todo: normalize table so all rows have length of max length row
    }
}

export {table, table as default}