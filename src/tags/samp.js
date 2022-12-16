import textContent from "./text-content.js";

const samp = {
    contentAllowed:{...textContent}
}
delete samp.contentAllowed.samp;

export {samp,samp as default}