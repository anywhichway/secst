import sanitizeCSS from "../sanitize-css.js";

const style = {
    attributesAllowed: {
        selector: true
    },
    contentAllowed: true,
    transform(node) {
        const css = sanitizeCSS(node.content.join(";"));
        if(node.attributes.selector) {
            node.content = [`${node.attributes.selector} { ${css} }`]
            delete node.attributes.selector;
        } else if(node.attributes.url && node.attributes.startsWith(".#")) {
            node.content = [`$node.attributes.url.substring(1)} { ${css} }`]
            deletenode.attributes.url;
        } else {
            node.content = [css]
        }
        return node;
    }
}
delete style.contentAllowed.style;

export {style,style as default}