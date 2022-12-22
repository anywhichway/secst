import flowContent from "./flow-content.js";
import phrasingContent from "./phrasing-content.js";

const allTags = {};

const mapTags = async (tags) => {
    if(tags && typeof(tags)==="object") {
        for(const [key,value] of Object.entries(tags)) {
            if(!allTags[key]) {
                if(typeof(value)==="function") {
                    allTags[key] = await value.call(tags);
                } else {
                    allTags[key] = value;
                }
                await mapTags(allTags[key].contentAllowed)
            }
        }
    }
}

await mapTags({...phrasingContent,...flowContent});

export {allTags, allTags as default}