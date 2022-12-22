const keySort = (object) => {
    const keys = Object.keys(object).sort(),
        result = {};
    keys.forEach((key) => result[key] = object[key]);
    return result;
}

const toTagSpecs = async (data,seen= {}) => {
    for(const key in data) {
        let tag = {...data[key]};
        if(typeof(tag)==="function") {
            tag = {...await tag()};
        }
        if(seen[key]) {
            continue;
        }
        seen[key] = tag;
        for(const property in tag) {
            const value = tag[property],
                type = typeof (value);
            if (property === "contentAllowed") {
                if (type === "function") {
                    tag.contentAllowed = await tag.contentAllowed();
                }
                if (tag.contentAllowed && typeof(tag.contentAllowed)==="object") {
                    tag.contentAllowed = {...tag.contentAllowed};
                    await toTagSpecs(tag.contentAllowed, seen);
                    for (const key in tag.contentAllowed) {
                        tag.contentAllowed[key] = true;
                    }
                    tag.contentAllowed = keySort(tag.contentAllowed);
                }
            } else if (property === "attributesAllowed") {
                tag.attributesAllowed = {...value};
                if(type==="object") {
                    for(const key in value) {
                        if(key.includes("-")) {
                            delete tag.attributesAllowed[key]
                        } else {
                            tag.attributesAllowed[key] = true;
                        }
                    }
                    tag.attributesAllowed = keySort(tag.attributesAllowed);
                }
            } else if(type==="function") {
                tag[property] = true;
            }
        }
    }
    return seen;
}

export {toTagSpecs, toTagSpecs as default}