const keySort = (object) => {
    const keys = Object.keys(object).sort(),
        result = {};
    keys.forEach((key) => result[key] = object[key]);
    return result;
}

const toTagSpecs = async (data,seen) => {
    let isRoot;
    if(!seen) {
        seen = {};
    }
    for(const key of Object.keys(data).sort()) {
        if(seen[key]) {
            continue;
        }
        let tag = {...data[key]};
        if(typeof(tag)==="function") {
            tag = {...await tag()};
        }
        if(tag.htmlDocLink==null) {
            tag.htmlDocLink =  `<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${key}" target="_tab">html</a>`;
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
                        const type = typeof(value[key]);
                        if(key.includes("-")) {
                            delete tag.attributesAllowed[key]
                        } else if(type==="function") {
                            tag.attributesAllowed[key] = (key==value[key].name ? "transform " : "") + `${value[key].name}(value)`;
                        }  else if(type==="object" && !Array.isArray(value[key])) {
                            tag.attributesAllowed[key] = "custom validation object";
                        } else if(Array.isArray(value[key])) {
                            tag.attributesAllowed[key] = `one of [${value[key].join(", ")}]`;
                        } else {
                            tag.attributesAllowed[key] = value[key];
                        }
                    }
                    tag.attributesAllowed = keySort(tag.attributesAllowed);
                }
            } else if(type==="function") {
                tag[property] = true;
            }
        }
    }
    return isRoot ? keySort(seen) : seen;
}

export {toTagSpecs, toTagSpecs as default}