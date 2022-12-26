const repl = {
    attributesAllowed: {
        head(value) {
            if (value === "" || value == true) {
                return {
                    head: ""
                }
            }
            if(value==="hidden" || value==="readonly") {
                return;
            }
            throw new TypeError('must have value "true" or "" or "hidden" or "readonly" if present')
        },
        css(value) {
            if (value === "" || value == true) {
                return {
                    css: ""
                }
            }
            if(value==="hidden" || value==="readonly") {
                return;
            }
            throw new TypeError('must have value "true" or "" or "hidden" or "readonly" if present')
        },
        body(value) {
            if (value === "" || value == true) {
                return {
                    body: ""
                }
            }
            if(value==="hidden" || value==="readonly") {
                return;
            }
            throw new TypeError('must have value "true" or "" or "hidden" or "readonly" if present')
        },
        javascript(value) {
            if (value === "" || value == true) {
                return {
                    javascript: ""
                }
            }
            if(value==="hidden" || value==="readonly") {
                return;
            }
            throw new TypeError('must have value "true" or "" or "hidden" or "readonly" if present')
        },
        linenumbers(value) {
            if (value === "" || value == true || value=="false") {
                return {
                    linenumbers: value=="false" ? false : ""
                }
            }
            throw new TypeError('must have value "true" or "" or "false" if present')
        },
        replstyle: "string"
    },
    htmlDocLink: '<a target="_tab" href="https://www.npmjs.com/package/@anywhichway/repl-host">html</a>',
    additionalDocLinks: ['<a target="_tab" href="https://medium.com/@anywhichway/how-to-host-a-repl-342bc0e15f5d">Medium: How To Host A REPL</a>'],
    contentAllowed: {
        slot: {
            attributesAllowed: {
                name: "string",
                hidden: "boolean",
                readonly: "boolean",
                linenumbers(value) {
                    if (value === "" || value == true || value=="false") {
                        return {
                            javascript: value=="false" ? false : ""
                        }
                    }
                    throw new TypeError('must have value "true" or "" or "false" if present')
                }
            },
            contentAllowed: true
        }
    },
    requires: [
        {
            tag: "script",
            attributes: {
                src: "https://cdn.jsdelivr.net/npm/@anywhichway/quick-component@0.0.15",
                component: "./repl-host"
            }
        }
    ],
    beforeMount(node) {
        node.tag = "repl-host";
        return node;
    }
}

export {repl,repl as default}