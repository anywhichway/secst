import textContent from "./text-content.js";

const headings = {
    h: {
        contentAllowed: {
            ...textContent
        },
        transform(node,{level}) {
            node.tag = "h" + level;
            return node;
        }
    }
};

for(let i=1;i<=8;i++) {
    headings["h"+i] = {
        contentAllowed: {
            ...textContent
        }
    }
}

export {headings,headings as default}