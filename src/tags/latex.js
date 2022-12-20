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
        },
        {
            tag: "script",
            attributes: {
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js",
                integrity: "sha384-PwRUT/YqbnEjkZO0zZxNqcxACrXe+j766U2amXcgMg5457rve2Y7I6ZJSm2A0mS4",
                crossOrigin: "anonymous"
            }
        },
        {
            tag: "script",
            attributes: {
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/contrib/mhchem.min.js",
                integrity: "sha384-RTN08a0AXIioPBcVosEqPUfKK+rPp+h1x/izR7xMkdMyuwkcZCWdxO+RSwIFtJXN",
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
        if(typeof(katex)!=="undefined") {
            return katex.renderToString(node.content[0],{
                throwOnError: true
            })
        }
        // server renderding of Latex with chem does not work well
        const text = node.content[0].replaceAll(/\\/g,"\\\\");
        return '<script>(() => { const html = katex.renderToString("' + text + '"); document.currentScript.parentElement.innerHTML = html; })()</script>';
    }
}

export {latex,latex as default}