const sheetMusic = {
    contentAllowed: true,
    requires: [
        {
            tag: "script",
            attributes: {
                src: "https://cdn.jsdelivr.net/npm/@anywhichway/quick-component@0.0.14/quick-component.min.js",
                component: "https://cdn.jsdelivr.net/npm/@anywhichway/sheet-music@0.0.1"
            }
        }
    ],
    beforeMount(node) {
        node.tag = "sheet-music";
        return node;
    },
    toHTML(node) {
        return  node.content.join("");
    }
}

export {sheetMusic,sheetMusic as default}