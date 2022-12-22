import phrasingContent from "./phrasing-content.js";
import forEach from "./for-each.js";
import forEntries from "./for-entries.js";

const contentAllowed = {
    ...phrasingContent
};
delete contentAllowed.dl;

const dl = {
    contentAllowed: {
        forEach,
        forEntries,
        dt: {
            contentAllowed
        },
        dd: {
            contentAllowed
        }
    }
}
dl.contentAllowed.dl = dl;

export {dl,dl as default}