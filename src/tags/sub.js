import textContent from "./text-content.js";

const sub = {
    contentAllowed:{...textContent}
}
delete sub.contentAllowed.sub;

export {sub,sub as default}