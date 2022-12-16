import textContent from "./text-content.js";

const strike = {
    contentAllowed:{...textContent}
}
delete strike.contentAllowed.strike;

export {strike,strike as default}