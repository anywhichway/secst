const meta = {
    contentAllowed: true,
    attributesAllowed: {
        name: true,
        content: true
    },
    transform(node) {
        node.attributes.content = node.content.join("");
        node.content = [];
        return node;
    },
    connected(el) {
        el.ownerDocument.head.appendChild(el);
    }
}

export {meta,meta as default}