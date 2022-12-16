import textContent from "./text-content.js";

const mark = {
    contentAllowed:{...textContent}
}
delete mark.contentAllowed.mark;

export {mark,mark as default}