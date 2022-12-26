const sheetMusic = {
    htmlDocLink: "",
    contentAllowed: true,
    requires: [
        {
            tag: "script",
            attributes: {
                src: "https://cdn.jsdelivr.net/npm/@anywhichway/quick-component@0.0.15",
                component: "https://cdn.jsdelivr.net/npm/@anywhichway/sheet-music@0.0.1"
            }
        }
    ],
    beforeMount(node) {
        node.tag = "sheet-music";
        return node;
    },
    toInnerHTML(node) {
        return  node.content.join("");
    }
}

export {sheetMusic,sheetMusic as default}