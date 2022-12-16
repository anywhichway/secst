import phrasingContent from "./phrasing-content.js";
import flowContent from "./flow-content.js";

const blockContent = {
    ...flowContent
}

Object.keys(phrasingContent).forEach((key) => delete blockContent[key]);

export {blockContent,blockContent as default}