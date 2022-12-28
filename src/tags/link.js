import Tag from "../tag.js";

const link = {
    attributesAllowed: {
        url(value) {
            this.href(value);
            return {
                href: value
            }
        },
        href(value) {
            new URL(value,document?.baseURI);
        },
        rel: ["stylesheet"]
    },
    async transform(node) {
        if(node.attributes.static!==null) {
            const response = await fetch(node.attributes.href||node.attributes.url);
            if(response.status===200) {
                const style = await response.text();
                node.tag = "style";
                node.content = [style];
                node.attributes = {};
                node.skipContent = true;
                return node;
            }
        }
    }
}

export {link,link as default}