const Person = {
    contentAllowed: {
        name: {
            contentAllowed: true,
            minCount: 1,
            maxCount: 1,
            toJSONLD(node) {
                node.classList.push("JSON-LD-Person-name");
                return {name:node.content[0]};
            }
        }
    },
    toJSONLD(node) {
        node.classList.push("JSON-LD-Person");
        const name = node.getContentByTagName("name")[0];
        return {
            "@type": "Person",
            name: name.toJSONLD(name).name
        }
    },
    beforeMount(node) {
        node.tag = "span";
        return node;
    }
}

export {Person,Person as default}