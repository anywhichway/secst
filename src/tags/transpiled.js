import {HighlightJS} from "highlight.js";

const transpiled = {
    async contentAllowed() {
        const {flowContent} = await import("./flow-content.js"),
            {bodyContent} = await import("./body-content.js");
        return this.contentAllowed = {
            ...flowContent,
            ...bodyContent
        }
    },
    mounted(el) {
        el.innerHTML = `<pre><code class="language-html">${el.innerHTML.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`;
        HighlightJS.highlightElement(el);
    },
    requires: [
        {
            tag: "link",
            attributes: {
                rel: "stylesheet",
                href: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/styles/default.min.css"
            }
        }
    ]
}


export {transpiled,transpiled as default}