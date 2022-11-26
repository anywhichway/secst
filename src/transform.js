import {tags, universalAttributes} from "./tags.js";

const patchTopLevel = (tree) => {
    let previous;
    return tree.reduce((result,node) => {
        if(typeof(node)==="string") {
            const paragraphs = node.split("\n\n");
            paragraphs.forEach((paragraph,i) => {
                if(i===0 && previous) {
                    previous.content.push(paragraph);
                } else {
                    previous = {tag:"p",content:[paragraph]};
                    result.push(previous)
                }
            })
        } else if(previous && !tags[node.tag]?.allowAsRoot) {
            previous.content.push(node);
        } else {
            previous = null;
            result.push(node);
        }
        return result;
    },[]);
}

const validateNode = async ({parser,node,path=[],errors=[]}) => {
    if(!node || typeof(node)!=="object") {
        return;
    }
    const tag = node.tag;
    let config = tags[tag];
    if(!config) {
        if(tag.startsWith(":")) {
           config = tags.emoticon;
           node.attributes ||= {};
           node.attributes.name = tag.substring(1);
        } else {
            node.drop = true;
            errors.push(new parser.SyntaxError(`Dropping unknown tag ${tag}`,null,null,node.location));
            return errors;
        }
    }
    if(path.length===0 && !config.allowAsRoot) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} is not permitted as a root level element`,null,null,node.location));
        return errors;
    }
    if(config.parentRequired && (path.length==0 || !config.parentRequired.includes(path[path.length-1].tag))) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} required parent to be one of`,JSON.stringify(config.parentRequired),path[path.length-1].tag,node.location));
        return errors;
    }

    let ancestorIndex;
    if(path.length>0 && !config.indirectChildAllowed && Array.isArray(config.contentAllowed) && !config.contentAllowed.includes(tag) && (ancestorIndex = path.findIndex((ancestor) => ancestor.tag===tag)!==-1)) {
        node.drop = true;
        const ancestor = path[ancestorIndex+1];
        ancestor.content.splice(ancestor.content.findIndex((node) => node.tag===tag),1,...node.content);
        errors.push(new parser.SyntaxError(`${tag} is not permitted as a nested element of self. Elevating content.`,null,null,node.location));
    }

    node.attributes ||= {};

    if(config.transform) {
        await config.transform(node);
    }
    if(node.content.length>0 && !config.contentAllowed) {
        while(node.content.length) { // try remove whitespace
            const item = node.content[0];
            if(typeof(item)!=="string" || item.trim().length!==0) {
                break;
            }
            node.content.shift();
        }
        if(node.content.length>0) {
            errors.push(new parser.SyntaxError(`${tag} is not permitted to have any content. Dropping content.`,null,JSON.stringify(node.content),node.location));
            node.content = [];
        }
    }
    node.content = await node.content.reduce(async (content,child) => {
        content = await content;
        const type = typeof(child);
        if(type==="string") {
            if(config.contentAllowed) {
                content.push(child);
                return content;
            }
            errors.push(new parser.SyntaxError(`${tag} does not allow string child. Dropping child.`,null,null,node.location))
        }
        if(child && type==="object") {
            if(!config.contentAllowed.includes(child.tag)) {
                errors.push(new parser.SyntaxError(`${tag} does not allow child ${child.tag}. Dropping child.`,null,null,node.location))
            } else {
                await validateNode({parser,node:child,path:[...path,node],errors})
                if(!child.drop)  {
                    content.push(child);
                    // elevate trailing space to parent
                    if(child.content[child.content.length-1]===" ") {
                        content.push(child.content.pop());
                    }
                }
            }
            return content;
        }
        errors.push(new parser.SyntaxError(`${tag} has unexpected child type ${type} ${child}. Dropping child.`,null,null,node.location));
        return content;
    },[]);
    config.attributesAllowed ||= {};
    Object.entries(node.attributes||{}).forEach(([key,value]) => {
        const attributeAllowed = universalAttributes[key] || config.attributesAllowed[key],
            type = typeof(attributeAllowed);
        if(type==="function") {
            const result = attributeAllowed(value,node);
            delete node.attributes[key];
            if(result) {
                Object.assign(node.attributes,result);
            }

        } else if(attributeAllowed && type==="object") {
            if(attributeAllowed.transform) {
                const result = attributeAllowed.transform(value,node);
                delete node.attributes[key];
                if(result) {
                    Object.assign(node.attributes,result);
                }
            }
            if(attributeAllowed.default && node.attributes[key] == null) {
                node.attributes[key] = attributeAllowed.default;
            }
            if (attributeAllowed.required && node.attributes[key] == null) {
                errors.push(new parser.SyntaxError(`${tag} is required to have attribute '${key}'`,null,null,node.location));
                return;
            }
            if(attributeAllowed.validate) {
                let valid;
                try {
                    valid = attributeAllowed.validate(value,node);
                } catch(e) {
                    valid = e+"";
                }
                if(valid!==true) {
                    delete node.attributes[key];
                    errors.push(new parser.SyntaxError(`${tag} the value of attribute '${key}' is invalid`,valid,value,node.location));
                }
            }
        } else if(attributeAllowed!==true) {
            delete node.attributes[key];
            errors.push(new parser.SyntaxError(`${tag} does not allow attribute ${key}`,null,JSON.stringify(value),node.location))
        }
    })
    if(node.attributes.style) {
        const styleAllowed = config.styleAllowed;
        if(typeof(styleAllowed)==="function") {
            node.attributes.style = styleAllowed(node.attributes.style,node);
        } else if(!styleAllowed) {
            delete node.attributes.style;
            errors.push(new parser.SyntaxError(`${tag} does not allow styling. Dropping style`,null,null,node.location))
        }
    }
    if(tag!==node.tag) { // node was transformed to a different node type, so validate that also
        await validateNode({parser,node,path,errors});
    }
    return errors;
};
const required = new Set(),
    domParser = typeof(DOMParser)==="function" ? new DOMParser() : null;
const toDOMNodes = (nodes,parentConfig) => {
        return nodes.reduce((domNodes,node) => {
            if(typeof(node)==="string") {
                if(parentConfig && parentConfig.breakOnNewline) {
                    const lines = node.split("\n");
                    while(lines[lines.length-1]==="") {
                        lines.pop(); // remove trailing whitespaces
                    }
                    lines.forEach((line,i) => {
                        domNodes.push(new Text(line));
                        if(i<lines.length-1) {
                            domNodes.push(document.createElement("br"))
                        }
                    })
                } else {
                    domNodes.push(node); // new Text(node) sanitize?
                }
            } else if(!node.drop) {
                const  {tag,id,classList,attributes} = node,
                    config = tags[tag],
                    el = node.toText ? document.createElement("span") : document.createElement(tag);
                if(id) el.id = id;
                if(config.requires && !required.has(config.requires)) {
                    required.add(config.required);
                    config.requires.forEach(({tag,attributes={}}) => {
                        const el = document.createElement(tag);
                        Object.entries(attributes).forEach(([key,value]) => {
                            el.setAttribute(key,value);
                        });
                        domNodes.push(el);
                    });
                }
                (classList||[]).forEach((className) => el.classList.add(className));
                if(config.toText) {
                    el.innerText = config.toText(node);
                } else {
                    Object.entries(attributes||{}).forEach(([key,value]) => { // style mapping done here so that it bypasses earlier sanitation
                        const attributeAllowed = config.attributesAllowed[key];
                        if(key==="style" && value && typeof(value)==="object") {
                            Object.entries(value).forEach(([key,value]) => {
                                key.includes("-") ? el.style.setProperty(key,value) : el.style[key] = value;
                            })
                        } else if(attributeAllowed?.mapStyle) {
                            const styleName = attributeAllowed.mapStyle;
                            styleName.includes("-") ? el.style.setProperty(styleName,value) : el.style[styleName] = value;
                        } else {
                            el.setAttribute(key,value);
                        }
                    });
                    if(node.tag==="script") {
                        el.setAttribute("type","module");
                    }
                    toDOMNodes(node.content,config).forEach((node) => {
                        if(typeof(node)==="string") {
                            const body = domParser ? domParser.parseFromString(node,"text/html").body : document.createElement("div");
                            if(body.tagName==="div") body.innerHTML = node;
                            if(el.lastChild) {
                                while(body.lastChild) {
                                    el.appendChild(body.lastChild)
                                }
                            } else {
                                el.innerHTML = node;
                            }
                        } else {
                            el.appendChild(node);
                        }
                    });
                }
                domNodes.push(el);
                const listeners = Object.entries(config.listeners||[]);
                if(listeners.length>0) {
                    const script = document.createElement("script");
                    script.innerHTML = listeners.reduce((string,[name,f]) => {
                        let fstring = f +"";
                        if(fstring.startsWith(`${name}(`)) {
                            fstring = fstring.replace(`${name}(`,"function(")
                        }
                        string += `document.currentScript.previousElementSibling.addEventListener("${name}",${fstring});\n`;
                        if(name==="attributeChanged") {
                            string += "secstObserver.observe(document.currentScript.previousElementSibling,{attributes:true,attributeOldValue:true}});\n";
                        } else if(name==="disconnected") {
                            string += "secstObserver.observe(document.currentScript.previousElementSibling.parentElement,{childList:true}});\n";
                        }
                        return string;
                    },"");
                    domNodes.push(script);
                }
            }
            return domNodes;
        },[])
    };
toDOMNodes.reset = () => required.clear();

const configureStyles = (tags,styleAllowed) => {
        if(styleAllowed==="*") {
            Object.values(tags).forEach((config) => {
                config.styleAllowed ||= true;
            })
        } else if(typeof(styleAllowed)==="function") {
            Object.values(tags).forEach((config) => {
                config.styleAllowed ||= styleAllowed;
            })
        } else {
            Object.entries(styleAllowed||[]).forEach(([key,value]) => {
                let config;
                if(typeof(value)==="function") {
                    config = tags[key];
                    config.styleAllowed ||= value;
                } else {
                    config = tags[value];
                    config.styleAllowed ||= true;
                }
                if(!config) {
                    console.error(new parser.SyntaxError(`${key} is not a defined tag and can't be styled`,null,null,node.location))
                }
            })
        }
    };

const transform = async (parser,text,{styleAllowed}={}) => {
    if(styleAllowed) {
        configureStyles(tags,styleAllowed);
    }
    console.log(text)
    const transformed = patchTopLevel(parser.parse(text));
    const parsed = JSON.parse(JSON.stringify(transformed));
    const errors = await transformed.reduce(async (errors,node) => {
        return [...await errors,...await validateNode({parser,node})]
    },[]);
    const dom = document.createDocumentFragment();
    dom.appendChild(dom.head=document.createElement("head"));
    dom.appendChild(dom.body = document.createElement("body"));
    toDOMNodes(transformed).forEach((node) => {
        dom.body.appendChild(node);
    })
    return {dom,errors,parsed,transformed};
}

export {transform}
