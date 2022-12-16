import phrasingContent from "./phrasing-content.js";

const characterEntity = {
    contentAllowed: true,
    transform(node) {
        const values = node.content[0].split(" ");
        node.content = [values.map((item) => "&"+item+";").join("")];
        return node;
    },
    beforeMount(node) {
        node.tag = "span";
        return node;
    }
}

export {characterEntity,characterEntity as default}