import textContent from "./text-content.js";
import br from "./br.js";
import emoji from "./emoji.js";
import escape from "./escape.js";
import hashtag from "./hashtag.js";
import input from "./input.js";
import hr from "./hr.js";
import img from "./img.js";
import mentions from "./mentions.js";
import table from "./table.js";
import textarea from "./textarea.js";
import transpiled from "./transpiled.js";
import value from "./value.js";

// if tags have content phrasingContent, the must be loaded dynamically or a compile loop will occur

const phrasingContent = {
    ...textContent,
    "&": async function() { const {characterEntity} = await import("./character-entity.js"); return this["&"] = characterEntity; },
    br,
    async code() { const {code} = await import("./code.js"); return this.code = code; },
    async details() { const {details} = await import("./details.js"); return this.details = details; },
    async dl() { const {dl} = await import("./dl.js"); return this.dl = dl; },
    emoji,
    escape,
    async footnote() { const {footnote} = await import("./footnote.js"); return this.footnote = footnote; },
    hashtag,
    hr,
    input,
    img,
    async latex() { const {latex} = await import("./latex.js"); return this.latex = latex; },
    ...mentions,
    async ol() { const {ol} = await import("./ol.js"); return this.ol = ol; },
    async question() { const {question} = await import("./question.js"); return this.question = question; },
    table,
    textarea,
    transpiled,
    async ul() { const {ul} = await import("./ul.js"); return this.ul = ul; },
    value:value
}

export {phrasingContent,phrasingContent as default}