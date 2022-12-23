import phrasingContent from "./phrasing-content.js";

const footnote = {
    htmlDocLink: "",
    contentAllowed:{
        ...phrasingContent
    },
    attributesAllowed: {
        url(value) {
            this.href(value);
            return {
                href: value
            }
        },
        href(value) {
            if(value[0]!=="#") {
                throw new TypeError(`Footnote href ${value} must start with a #`)
            }
            new URL(value,document?.baseURI);
        }
    },
    transform(node) {
        node.classList.push("autohelm-footnote")
        return node;
    },
    beforeMount(node) {
        node.tag = "span";
        return node;
    }
}
delete footnote.contentAllowed.footnote;

export {footnote,footnote as default}