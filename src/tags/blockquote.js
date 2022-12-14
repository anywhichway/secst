import phrasingContent from "./phrasing-content.js";

const blockquote = {
    contentAllowed: {
        ...phrasingContent
    },
    attributesAllowed: {
        cite(value) {
            new URL(value)
        }
    },
    transform(node) {
        return node;
    }
}
delete blockquote.contentAllowed.blockquote;

export {blockquote,blockquote as default}