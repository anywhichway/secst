import headings from "./headings.js";
import p from "./p.js";
import phrasingContent from "./phrasing-content.js";
import sectioningContent from "./sectioning-content.js";


// dynamic loading on some to prevent a compile loop

const flowContent = {
    async blockquote() {const {blockquote} = await import("./blockquote.js"); return this.blockquote = blockquote; },
    ...headings,
    p,
    ...phrasingContent,
    ...sectioningContent
}

export {flowContent,flowContent as default}