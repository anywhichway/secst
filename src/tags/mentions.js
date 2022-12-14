const mentions = {
    "@facebook": {
        htmlDocLink: "",
        attributesAllowed: {
            href(value) {
                new URL(value)
            },
            target: "string"
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://facebook.com/${user}`;
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@facebook";
            }
            delete node.attributes.user;
            return node;
        }
    },
    "@github": {
        htmlDocLink: "",
        attributesAllowed: {
            href(value) {
                new URL(value)
            },
            target: "string"
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://github.com/${user}`;
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@github";
            }
            delete node.attributes.user;
            return node;
        }
    },
    "@linkedin": {
        htmlDocLink: "",
        attributesAllowed: {
            href(value) {
                new URL(value)
            },
            target: "string"
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://linkedin.com/in/${user}`;
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@linkedin";
            }
            delete node.attributes.user
            return node;
        }
    },
    "@twitter": {
        htmlDocLink: "",
        attributesAllowed: {
            href(value) {
                new URL(value)
            },
            target: "string"
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://twitter.com/${user}`
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@twitter";
            }
            delete node.attributes.user;
            return node;
        }
    }
}

export {mentions,mentions as default}