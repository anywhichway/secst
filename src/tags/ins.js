import textContent from "./text-content.js";

const ins = {
    contentAllowed:{...textContent}
}
delete ins.contentAllowed.ins;

export {ins,ins as default}