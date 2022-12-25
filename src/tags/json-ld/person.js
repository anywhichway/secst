const Person = {
    htmlDocLink: "",
    additionalDocLinks: ['<a target="_tab" href="https://schema.org/Person">JSON schema</a>'],
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
        const name = node.getTagsByName("name")[0];
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