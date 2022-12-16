import phrasingContent from "./phrasing-content.js";

const contentAllowed = {
    ...phrasingContent
};
delete contentAllowed.dl;

const dl = {
    contentAllowed: {
        dt: {
            contentAllowed
        },
        dd: {
            contentAllowed
        }
    }
}

export {dl,dl as default}