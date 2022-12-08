import {init as initAutohelm} from "@anywhichway/autohelm";

import {tags, universalAttributes} from "./tags.js";

const getContentByTagName = function(node,tagName,results=[]) {
    if(node.content) {
        node.content.reduce((results,item) => {
            if(item.tag===tagName) {
                results.push(item)
            }
            if(item.content) {
                item.content.forEach((node) => {
                    getContentByTagName(node,tagName,results);
                })
            }
            return results;
        },results)
    }
    return results;
};

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
        } else if(previous && !tags[node.tag]?.allowAsRoot) {
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

const toElement = async (node,{domNodes,connects,parentConfig}) => {
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
            const decoder = document.createElement("textarea");
            decoder.innerHTML = node;
            domNodes.push(new Text(decoder.innerText)); // new Text(node) sanitize?
        }
    } else if(!node.drop) {
        if(node.toJSONLD) {
           // console.log(node.toJSONLD(node))
        }
        if(node.beforeMount) {
            node.beforeMount(node)
        }
        const {tag, id, classList, attributes} = node,
            config = tags[tag];
        let el = node.toText ? document.createElement("span") : document.createElement(tag);
        el.connects ||= [];
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
                    domNodes.push(el);
                });
            }
        });
        (classList || []).forEach((className) => el.classList.add(className));
        Object.entries(attributes || {}).forEach(([key, value]) => { // style mapping done here so that it bypasses earlier sanitation
            const attributeAllowed = (config?.attributesAllowed || {})[key];
            if (key === "style" && value && typeof (value) === "object") {
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
        });
        if (node.tag === "script" && !node.attributes.type) {
            el.setAttribute("type", "module");
        }
        if(node?.toElement) {
            el = await node.toElement(node,{domNodes,connects,parentConfig:config});
        } else if(node?.toHTML) {
            el.innerHTML = await node.toHTML(node,el);
        } else if (node?.toText) {
            el.innerText = await node.toText(node,el);
        } else if(node.render) {
            await node.render(node,el);
        } else {
            (await toDOMNodes(node.content,config,connects)).forEach((node) => {
                if(typeof(node)==="string") {
                    const body = domParser ? domParser.parseFromString(node,"text/html").body : document.createElement("div");
                    if(body.tagName==="div" || body.tagName==="span") {
                        body.innerHTML = node;
                    }
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
        if(node.mounted) {
            node.mounted(el,node);
        }
        if(node.connected) {
            connects.push(() => node.connected(el,node));
        }
        domNodes.push(el);
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
            domNodes.push(script);
        }
    }
}

const validateNode = async ({parser,node,path=[],contentAllowed= tags,errors=[]}) => {
    if(!node || typeof(node)!=="object") {
        return;
    }
    node.getContentByTagName = getContentByTagName.bind(node,node);
    if(contentAllowed==="*") {
        contentAllowed = tags;
    } else if(typeof(contentAllowed)==="function") {
        contentAllowed = contentAllowed();
    }
    node.attributes ||= {};
    node.classList ||= [];
    node.content ||= [];
    let tag = node.tag,
        config = contentAllowed[tag] || tags[tag];
    if(!config) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`Dropping unknown tag ${tag}`,null,null,node.location));
        return {node,errors};
    }
    if(path.length===0 && !config.allowAsRoot) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} is not permitted as a root level element`,null,null,node.location));
        return {node,errors};
    }
    if(config.parentRequired && (path.length===0 || !config.parentRequired.includes(path[path.length-1].tag))) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} required parent to be one of`,JSON.stringify(config.parentRequired),path[path.length-1].tag,node.location));
        return {node,errors};
    }
    if(!config.initialized) {
        config.initialized = true;
        if(config.contentAllowed) {
            config.contentAllowed = typeof(config.contentAllowed)==="function" ? config.contentAllowed() : config.contentAllowed;
            if(typeof(config.contentAllowed)==="object") {
                Object.entries(config.contentAllowed).forEach(([key,value]) => {
                    if(typeof(value)==="function") {
                        config.contentAllowed[key] = value();
                    }
                })
            }
        }
    }
    let ancestorIndex;
    if(path.length>0 && !config.indirectChildAllowed && config.contentAllowed && typeof(config.contentAllowed)==="object" && !config.contentAllowed[tag] && (ancestorIndex = path.findIndex((ancestor) => ancestor.tag===tag)!==-1)) {
        node.drop = true;
        const ancestor = path[ancestorIndex+1];
        ancestor.content.splice(ancestor.content.findIndex((node) => node.tag===tag),1,...node.content);
        errors.push(new parser.SyntaxError(`${tag} is not permitted as a nested element of self. Elevating content.`,null,null,node.location));
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
    if(config.transform) {
        const transformed = await config.transform(node,path);
        if(transformed===undefined) {
            debugger;
        }
        node = transformed;
        config = config.contentAllowed ? config.contentAllowed[node.tag] || contentAllowed[node.tag] : contentAllowed[node.tag];
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
    if(!node.skipContent) {
        const content = [];
        for(let child of node.content) {
            const type = typeof(child);
            if(type==="string") {
                if(config.contentAllowed) {
                    content.push(child);
                } else {
                    errors.push(new parser.SyntaxError(`${tag} does not allow string child. Dropping child.`,null,child,node.location))
                }
            } else if(child && type==="object") {
                if(!config.contentAllowed || (config.contentAllowed!=="*" && !config.contentAllowed[child.tag])) {
                    errors.push(new parser.SyntaxError(`${tag} does not allow child ${child.tag}.`,null,JSON.stringify(child),node.location));
                    child.tag = "error";
                } else {
                    const result = await validateNode({parser,node:child,path:[...path,node],contentAllowed:config.contentAllowed,errors});
                    child = result.node;
                    if(!child.drop)  {
                        content.push(child);
                    }
                }
            } else {
                errors.push(new parser.SyntaxError(`${tag} has unexpected child type ${type} ${child}. Dropping child.`,null,JSON.stringify(child),node.location));
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
                const result = attributeAllowed(value,node);
                if(result && typeof(result)==="object") {
                    delete node.attributes[key];
                    Object.assign(node.attributes,result);
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
    if(node.attributes.style) {
        const styleAllowed = config.styleAllowed;
        if(typeof(styleAllowed)==="function") {
            node.attributes.style = styleAllowed(node.attributes.style,node);
        } else if(!styleAllowed) {
            delete node.attributes.style;
            errors.push(new parser.SyntaxError(`${tag} does not allow styling. Dropping style`,null,null,node.location))
        }
    }
    return {node,errors};
};

const toDOMNodes = async (nodes,parentConfig,connects=[]) => {
    const domNodes = [];
    for(const node of nodes) {
        await toElement(node,{domNodes,connects,parentConfig});
    }
    domNodes.connects = connects;
    return domNodes;
};
toDOMNodes.reset = () => required.clear();

const configureStyles = (tags,styleAllowed) => {
        if(styleAllowed==="*") {
            Object.values(tags).forEach((config) => {
                config.styleAllowed ||= true;
                config.attributesAllowed ||= {};
                config.attributesAllowed.style = true;
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
    const transformed = patchTopLevel(parser.parse(text));
    const parsed = JSON.parse(JSON.stringify(transformed));
    const errors = await transformed.reduce(async (errors,node) => {
        const result = await validateNode({parser,node})
        return [...await errors,...result.errors]
    },[]);
    const dom = document.createDocumentFragment();
    dom.appendChild(dom.head = document.createElement("head"));
    dom.appendChild(dom.body = document.createElement("body"));
    dom.body.innerHTML = `<style>
        span.autohelm-nav a {all: unset} 
        span.autohelm-nav-up-down a {font-size: 80%; vertical-align:text-top} 
        mark.secst-error { background: red }
        details {
            display: inline
        }
        kbd {
            background-color: whitesmoke;
            border: 1px solid darkgray;
            border-radius: 2px;
            unicode-bidi: embed;
            font-family: monospace;
            white-space: pre;
            padding-left: 2px;
            padding-right: 2px;
        }
        table.secst {
            border: 1px solid black;
            border-collapse: collapse;
        }
        .secst th {
            background-color: whitesmoke;
        }
        .secst th, td {
            border: 1px solid black;
            padding: 5px;
        }
        textarea.secst {
                display: block;
                unicode-bidi: embed;
                font-family: monospace;
                white-space: pre;
            }
        }
        </style>`;
    const nodes = await toDOMNodes(transformed);
    nodes.forEach((node) => {
        dom.body.appendChild(node);
    });
    nodes.connects.forEach((connected) => {
        setTimeout(connected,1000)
    });
    try {
        initAutohelm({tocSelector:".toc",dom:dom.body,directChildren:true});
    } catch(e) {

    }
    return {dom,errors,parsed,transformed};
}

export {transform}
