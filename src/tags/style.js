import textContent from "./text-content.js";

const style = {
    contentAllowed: true,
    transform(node) {
        if(node.attributes.selector) {
            node.content = [`${node.attributes.selector} { ${node.content.join(";")} }`]
            delete node.attributes.selector;
        } else if(node.id) {
            node.content = [`#${node.id} { ${node.content.join(";")} }`]
            delete node.id;
        } else {
            node.content = [node.content.join(";")]
        }
        return node;
    }
}
delete style.contentAllowed.style;

export {style,style as default}