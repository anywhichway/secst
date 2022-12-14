import Tag from "./tag.js";
import bodyContent from "./tags/body-content.js";
import universalAttributes from "./universal-attributes.js";
import getTagsByName from "./get-tags-by-name.js";


const patchTopLevel = (tree) => {
    let previous;
    return tree.reduce((result,node) => {
        if(typeof(node)==="string") {
            const paragraphs = node.split("\n\n");
            paragraphs.forEach((paragraph,i) => {
                if(i===0 && previous) {
                    previous.content.push(paragraph);
                } else if(paragraph.trim()!=="") {
                    previous = {tag:"p",content:[paragraph]};
                    result.push(previous)
                }
            })
        } else if(previous && !bodyContent[node.tag]?.allowAsRoot) {
            previous.content.push(node);
        } else {
            previous = null;
            result.push(node);
        }
        return result;
    },[]);
}

const required = new Set(),
    domParser = typeof(DOMParser)==="function" ? new DOMParser() : null;
//decoder = document.createElement("textarea");

let allTags;
const toElement = async (node,{parent,connects,parentConfig}) => {
    if(!allTags) {
        allTags = await import("./tags/all-tags.js")
    }
    if(typeof(node)==="string") {
        if(parentConfig && parentConfig.breakOnNewline) {
            const lines = node.split("\n");
            while(lines[lines.length-1]==="") {
                lines.pop(); // remove trailing whitespaces
            }
            lines.forEach((line,i) => {
                //domNodes.push(new Text(line));
                parent.insertAdjacentHTML("beforeend",line.replaceAll(/</g,"&lt;").replaceAll(/>/g,"&gt;"));
                if(i<lines.length-1) {
                   // domNodes.push(document.createElement("br"))
                    parent.appendChild(document.createElement("br"))
                }
            })
        } else {
            //const decoder = document.createElement("textarea");
            //decoder.innerHTML = node;
            //domNodes.push(new Text(decoder.innerText)); // new Text(node) sanitize?
            parent.insertAdjacentHTML("beforeend",node.replaceAll(/</g,"&lt;").replaceAll(/>/g,"&gt;"));
        }
    } else if(!node.drop) {
        if(node.toJSONLD) {
            node.toJSONLD(node)
           // console.log(node.toJSONLD(node))
        }
        let config = parentConfig.contentAllowed[node.tag];
        if(typeof(config)==="function") {
            config = await config.call(parentConfig.contentAllowed);
        }
        if(node.beforeMount) {
            const transformed = node.beforeMount(node);
            if(node.tag!==transformed.tag && !["span","div"].includes(transformed.tag) && !transformed.tag.includes("-")) { // not span or div or custom element
                config = parentConfig.contentAllowed[transformed.tag]
                if(typeof(config)==="function") {
                    config = await config.call(parentConfig.contentAllowed);
                }
            }
            node = transformed;
        }
        const {tag, id, classList, attributes} = node,
            attributesAllowed = config.attributesAllowed||{};

        let el = node.toText ? document.createElement("span") : document.createElement(tag);
        if (id) el.id = id;
        node.requires?.forEach((require) => {
            if (!required.has(require)) {
                required.add(require);
                require.forEach(({tag, attributes = {}, innerText, innerHTML}) => {
                    const el = document.createElement(tag);
                    Object.entries(attributes).forEach(([key, value]) => {
                        el.setAttribute(key, value);
                    });
                    if (innerText) {
                        el.innerText = innerText;
                    } else if (innerHTML) {
                        el.innerHTML = innerHTML;
                    }
                    parent.appendChild(el);
                });
            }
        });
        (classList || []).forEach((className) => el.classList.add(className));
        Object.entries(attributes || {}).forEach(([key, value]) => {
            const attributeAllowed = attributesAllowed[key] || key.includes("-");
            if(attributeAllowed) {
                if (key === "style" && value && typeof (value) === "object") { // style mapping done here so that it bypasses earlier sanitation
                    Object.entries(value).forEach(([key, value]) => {
                        key.includes("-") ? el.style.setProperty(key, value) : el.style[key] = value;
                    })
                } else if (attributeAllowed?.mapStyle) {
                    const style = attributeAllowed.mapStyle;
                    if(typeof(style)==="string") {
                        style.includes("-") ? el.style.setProperty(style, value) : el.style[style] = value;
                    } else {
                        Object.entries(style).forEach(([style,value]) => {
                            style.includes("-") ? el.style.setProperty(style, value) : el.style[style] = value;
                        })
                    }
                } else {
                    el.setAttribute(key, value);
                }
            }
        });
        if (node.tag === "script" && !node.attributes.type) {
            el.setAttribute("type", "module");
        }
        if(node?.toElement) {
            el = await node.toElement(node,{parentConfig:config});
        } else if(node?.toInnerHTML) {
            el.innerHTML = await node.toInnerHTML(node,el);
        } else if (node?.toText) {
            el.innerText = await node.toText(node,el);
        } else if(node.render) {
            await node.render(node,el);
        } else {
            for(const child of node.content) {
                await toElement(child,{parent:el,parentConfig:config});
            }
        }
        parent.appendChild(el);
        if(node.mounted) {
            //node.mounted(el,{...node});  // todo make the node copy a deepcopy?
            el.mounted = async () => await node.mounted(el,{...node});
        }
        if(node.connected) {
            el.connected = async () => await node.connected(el,{...node}); // todo make the node copy a deepcopy?
        }
        //domNodes.push(el);

        const listeners = Object.entries(config?.listeners||[]);
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
           // domNodes.push(script);
            parent.appendChild(script);
        }
    }
}

import {macro as MACRO} from "./tags/macro.js";
const validateNode = async ({parser,node,path=[],parent={tag:"body",contentAllowed:bodyContent},errors=[],level=0,styleAllowed}) => {
    let { contentAllowed } = parent
    if(!node || typeof(node)!=="object") {
        return;
    }
    const macro = MACRO.macros.get(node.tag);
    if(macro) {
        node = MACRO.resolve(macro,node);
    }
    node.getTagsByName = getTagsByName.bind(node,node);
    if(typeof(contentAllowed)==="function") {
        contentAllowed = await contentAllowed();
    }
    node.attributes ||= {};
    node.classList ||= [];
    node.content ||= [];
    let tag = node.tag;
    const childConfig = contentAllowed[tag];
    if(!childConfig) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`Dropping unknown tag ${tag} in ${parent.tag} ${JSON.stringify(path)}`,null,null,node.location));
        return {node,errors};
    }
    let config = childConfig;
    if(typeof(config)==="function") {
        config = await config.call(contentAllowed);
    }
    config.tag = tag;
    /*if(config.parentRequired && (path.length===0 || !config.parentRequired.includes(path[path.length-1].tag))) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} required parent to be one of`,JSON.stringify(config.parentRequired),path[path.length-1].tag,node.location));
        return {node,errors};
    }*/
    if(typeof(config.contentAllowed)==="function") {
        config.contentAllowed = await config.contentAllowed();
    }
    node.attributes ||= {};
    node.requires ||= [];
    if(config.requires) node.requires.push(config.requires);
    Object.entries(config).forEach(([key,value]) => {
        if(typeof(value)==="function" && key!=="transform") {
            node[key] = value;
        }
    })
    let transformed;
    if(config.transform && !node.transformed) {
        const transformed = await config.transform(node,{path,level});
        node.transformed = true;
        if(transformed.tag!==node.tag && config.contentAllowed!=="*") {
            config = contentAllowed[transformed.tag];
            if(typeof(config)==="function") {
                config = await config.call(contentAllowed);
            }
            return validateNode({parser,node:transformed,path,parent,errors,level,styleAllowed})
        }
    }
    if(!node.skipContent && node.content.length>0 && !config.contentAllowed) {
        while(node.content.length) { // try remove whitespace
            const item = node.content[0];
            if(typeof(item)!=="string" || item.trim().length!==0) {
                break;
            }
            node.content.shift();
        }
        if(node.content.length>0) {
            errors.push(new parser.SyntaxError(`${tag} is not permitted to have any content in ${parent.tag} ${JSON.stringify(path)}. Dropping content.`,null,JSON.stringify(node.content),node.location));
            node.content = [];
        }
    }
    if(!node.skipContent && config.contentAllowed!=="*") {
        const content = [];
        for(let child of node.content) {
            const type = typeof(child);
            if(type==="string") {
                if(config.contentAllowed) {
                    content.push(child);
                } else {
                    errors.push(new parser.SyntaxError(`${tag} does not allow string child in ${parent.tag} ${JSON.stringify(path)}. Dropping child.`,null,child,node.location))
                }
            } else if(child && type==="object") {
                const macro = MACRO.macros.get(child.tag);
                if(macro) {
                    child = MACRO.resolve(macro,child);
                }
                if(!config.contentAllowed || (config.contentAllowed!=="*" && !config.contentAllowed[child.tag])) {
                    errors.push(new parser.SyntaxError(`${tag} does not allow child ${child.tag} in ${parent.tag} ${JSON.stringify(path)}.`,null,JSON.stringify(child),node.location));
                    child.tag = "error";
                } else {
                    const result = await validateNode({parser,node:child,path:[...path,node.tag],parent:config,errors,level:level+1,styleAllowed});
                    child = result.node;
                    if(!child.drop)  {
                        content.push(child);
                    }
                }
            } else {
                errors.push(new parser.SyntaxError(`${tag} has unexpected child type ${type} ${child} in ${parent.tag} ${JSON.stringify(path)}. Dropping child.`,null,JSON.stringify(child),node.location));
            }
        }
        node.content = content;
    }
    config.attributesAllowed ||= {};
    Object.entries(node.attributes||{}).forEach(([key,value]) => {
        try {
            const attributeAllowed = universalAttributes[key] || config.attributesAllowed[key],
                type = typeof(attributeAllowed);
            if(type==="function") {
                const result = attributeAllowed.call(config.attributesAllowed,value,node); // using config.attributesAlllowed as this ok with universal attributes
                if(result && typeof(result)==="object") {
                    delete node.attributes[key];
                    Object.assign(node.attributes,result);
                }
            } else if(type==="string") {
                if(typeof(value)!==attributeAllowed && !(attributeAllowed==="boolean" && value==="")) {
                    errors.push(new parser.SyntaxError(`${tag} the value ${key}:${value} type`,attributeAllowed,typeof(value),node.location));
                }
            } else if(Array.isArray(attributeAllowed)) {
                if(!attributeAllowed.some((item) => item===value)) {
                    errors.push(new parser.SyntaxError(`${tag} the value ${key}:${value} should be one of`,JSON.stringify(attributeAllowed),value,node.location));
                }
            } else if(attributeAllowed && type==="object") {
                if(attributeAllowed.transform) {
                    const result = attributeAllowed.transform(value,node);
                    if(result && typeof(result)==="object") {
                        delete node.attributes[key];
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
            } else if(attributeAllowed!==true && !key.startsWith("data-")) {
                delete node.attributes[key];
                errors.push(new parser.SyntaxError(`${tag} does not allow attribute ${key}`,null,JSON.stringify(value),node.location))
            }
        } catch(e) {
            errors.push(new parser.SyntaxError(`${tag}:${key} ${e.message}`,null,JSON.stringify(value),node.location))
        }
    })
    if(!styleAllowed && node.attributes.style!=null) {
        delete node.attributes.style;
        errors.push(new parser.SyntaxError(`${tag} does not allow styling in ${parent.tag} ${JSON.stringify(path)}. Dropping style`,null,null,node.location))
    }
    return {node,errors};
};

const mount = async (el) => {
    //if(!el.isConnected && [Node.TEXT_NODE,Node.ELEMENT_NODE,Node.COMMENT_NODE,Node.CDATA_SECTION_NODE].includes(el.nodeType)) {
    //    parent.appendChild(el);
    //}
    if([Node.ELEMENT_NODE,Node.DOCUMENT_FRAGMENT_NODE].includes(el.nodeType)) {
        for(const child of [...el.childNodes]) {
            await mount(child);
        }
    }
    if(el.mounted) {
        await el.mounted();
    }
}

const connect = async (el,parent) => {
    if(!el.isConnected && [Node.TEXT_NODE,Node.ELEMENT_NODE,Node.COMMENT_NODE,Node.CDATA_SECTION_NODE].includes(el.nodeType)) {
        parent.appendChild(el);
    }
    if([Node.ELEMENT_NODE,Node.DOCUMENT_FRAGMENT_NODE].includes(el.nodeType)) {
        for(const child of [...el.childNodes]) {
            await connect(child,el);
        }
    }
    if(el.connected) {
        await el.connected();
    }
}

const transform = async (parser,text,{styleAllowed}={}) => {
    const transformed = parser.parse(text,{Tag,JSON5}); //patchTopLevel(parser.parse(text,{Tag,JSON5}));
    const parsed = JSON.parse(JSON.stringify(transformed));
    const errors = await transformed.reduce(async (errors,node) => {
        if(typeof(node)==="string") return errors;
        try {
            const result = await validateNode({parser,node,styleAllowed});
            return [...await errors,...result.errors]
        } catch(e) {
            node.drop = true;
            return [...await errors,new parser.SyntaxError(e.message,null,null,node.location)]
        }
    },[]);
    const dom = document.createDocumentFragment();
    dom.appendChild(dom.head = document.createElement("head"));
    dom.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1" /></script>`;
    dom.appendChild(dom.body = document.createElement("body"));
    const header = document.createElement("header"),
        content = document.createElement("div"),
        footer = document.createElement("footer");
    header.id = "secst-header";
    content.id = "secst-content";
    footer.id = "secst-footer";
    [header,content,footer].forEach((el) => dom.body.appendChild(el));
    /*
            section > *:not(:first-child):not(section) {
            display: none
        }
     */
    if(!transformed.some((node) => node.tag==="theme" || getTagsByName(node,"theme").length>0)) {
        const link = document.createElement("link");
        link.setAttribute("rel","stylesheet");
        link.setAttribute("href","./assets/themes/secst.css");
        dom.body.appendChild(link);
    }
    for(const node of transformed) {
        if(!node.drop) {
            await toElement(node,{parent:content,parentConfig:{contentAllowed:bodyContent}})
        }
    }
    await mount(dom);
    await connect(dom,document);
    try {
        autohelm.init({tocSelector:".toc",dom:content,useSections:true});
    } catch(e) {

    }
    return {dom,errors,parsed,transformed};
}

export {transform}
