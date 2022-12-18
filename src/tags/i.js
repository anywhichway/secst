import textContent from "./text-content.js";

const i = {
    contentAllowed:{...textContent}
}
delete i.contentAllowed.i;

export {i,i as default}