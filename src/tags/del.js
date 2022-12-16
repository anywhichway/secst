import textContent from "./text-content.js";

const del = {
    contentAllowed:{...textContent}
}
delete del.contentAllowed.del;

export {del,del as default}