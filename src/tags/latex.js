import katex from "katex";

const latex = {
    contentAllowed: true,
    requires: [
        {
            tag: "link",
            attributes: {
                rel: "stylesheet",
                href: "https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.min.css",
                integrity: "sha384-Juol1FqnotbkyZUT5Z7gUPjQ9gzlwCENvUZTpQBAPxtusdwFLRy382PSDx5UUJ4/",
                crossOrigin: "anonymous"
            }
        }
    ],
    transform(node) {
        node.content = [node.content.join("\n")];
        node.skipContent = true;
        return node;
    },
    beforeMount(node) {
        if(node.content[0].endsWith("\n")) {
            node.tag = "div";
        } else {
            node.tag = "span";
        }
        return node;
    },
    toHTML(node) {
        return katex.renderToString(node.content[0],{
            throwOnError: false
        })
    }
}

export {latex,latex as default}