import textContent from "./text-content.js";

const pre = {
    contentAllowed:{...textContent}
}
delete pre.contentAllowed.pre;

export {pre,pre as default}