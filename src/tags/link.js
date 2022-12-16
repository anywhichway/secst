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
        type: ["rel"]
    }
}

export {link,link as default}