import link from "./link.js";
import listeners from "./listeners.js";
import macro from "./macro.js";
import meta from "./meta.js";
import sectioningContent from "./sectioning-content.js";
import style from "./style.js";
import theme from "./theme.js";
import title from "./title.js";

const bodyContent = {
    link,
    listeners,
    macro,
    meta,
    ...sectioningContent,
    style,
    theme,
    title
}

export {bodyContent,bodyContent as default}