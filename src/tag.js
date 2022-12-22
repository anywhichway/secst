import getTagById from "./get-tag-by-id.js";
import getTagsByName from "./get-tags-by-name.js";

class Tag {
    constructor({tag,options,content=[],location}) {
        const {attributes={}, classList=[], id } = options||{};
        Object.assign(this,{tag,id,classList,attributes,content});
        Object.defineProperty(this,"location",{value:location});
        this.getTagById = getTagById.bind(this,this);
        this.getTagsByName = getTagsByName.bind(this,this);
    }
    toString() {
        let string = ":" + this.tag;
        if(this.tag.startsWith("@")) {
            string = this.tag;
        }
        if(this.tag==="hashtag") {
            return this.content.reduce((tags,item) => {
                item.split(" ").forEach((tag) => tags.push("#" + tag.trim()));
                return tags;
            },[]).join(", ").trim()
        }
        const attributes = Object.entries(this.attributes||{}),
            classes = this.classes || [];
        if(this.id || classes.length>0 || attributes.length>0) {
            string += "(";
            if(this.id) string += "#" + this.id + " ";
            if(classes.length>0) {
                classes.forEach((className) => string += className + " ");
            }
            if(attributes.length>0) {
                let hasbraced;
                attributes.forEach(([key,value]) => {
                    if(value==="")  {
                        string += key + " ";
                    } else {
                        hasbraced = true;
                    }
                });
                if(hasbraced) {
                    const o = {...this.attributes};
                    attributes.forEach(([key,value]) => {
                        if(value==="") delete o[key];
                    })
                    string += JSON.stringify(o);
                }

            }
            string = string.trim() + ")";
        }
        const bracket = this.content.length>0;
        string += (bracket ? "[" : "") + this.content.map((item) => typeof(item)==="string" ? item : item.toString()).join(" ") + (bracket ? "]" : "");
        return string;
    }
}

export {Tag,Tag as default}