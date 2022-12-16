import link from "./link.js";
import listeners from "./listeners.js";
import meta from "./meta.js";
import sectioningContent from "./sectioning-content.js";
import style from "./style.js";
import title from "./title.js";
import toc from "./toc.js";

const bodyContent = {
    link: link,
    listeners: listeners,
    meta: meta,
    ...sectioningContent,
    style: style,
    title: title
}

export {bodyContent,bodyContent as default}