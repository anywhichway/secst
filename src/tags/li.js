import phrasingContent from "./phrasing-content.js";

const li = {
    breakOnNewline: true,
    attributesAllowed: {
        value(value) {
            if (parseInt(value) !== value) {
                throw new TypeError(`Attribute "value" for li must be a number not ${value}`)
            }
        },
        type(value) {
            if (!("aAiI1".includes(value) && value.length === 1)) {
                throw new TypeError(`Attribute "type" must be one of these letters: aAiI1`)
            }
        }
    },
    contentAllowed: {
        ...phrasingContent,
        async ul() { const {ul} = await import("./ul.js"); return this.ul = ul; },
        async ol() { const {ol} = await import("./ol.js"); return this.ol = ol; }
    }
}

export {li, li as default}