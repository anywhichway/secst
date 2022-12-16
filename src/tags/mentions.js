const mentions = {
    "@facebook": {
        attributesAllowed: {
            href: true,
            target: true
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
        attributesAllowed: {
            href: true,
            target: true
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
        attributesAllowed: {
            href: true,
            target: true
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
        attributesAllowed: {
            href: true,
            target: true
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