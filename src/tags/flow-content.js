import headings from "./headings.js";
import p from "./p.js";
import phrasingContent from "./phrasing-content.js";
import mermaidChart from "./mermaid-chart.js";
import sectioningContent from "./sectioning-content.js";
import sheetMusic from "./sheet-music.js";

// dynamic loading on some to prevent a compile loop

const flowContent = {
    async blockquote() {const {blockquote} = await import("./blockquote.js"); return this.blockquote = blockquote; },
    ...headings,
    mermaidChart,
    p,
    ...phrasingContent,
    ...sectioningContent,
    sheetMusic
}

export {flowContent,flowContent as default}