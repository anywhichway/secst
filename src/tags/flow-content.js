import headings from "./headings.js";
import p from "./p.js";
import phrasingContent from "./phrasing-content.js";
import toc from "./toc.js";

// article and section loaded dynamically to prevent a compile loop

const flowContent = {
    async article() {const {article} = await import("./article.js"); return this.article = article; },
    async blockquote() {const {blockquote} = await import("./blockquote.js"); return this.blockquote = blockquote; },
    ...headings,
    p,
    ...phrasingContent,
    async section() { const {section} = await import("./section.js"); return this.section = section; },
    toc
}


export {flowContent,flowContent as default}