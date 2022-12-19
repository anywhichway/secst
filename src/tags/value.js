import {updateValueWidths} from "../update-value-widths.js";

const value = {
    attributesAllowed: {
        "data-fitcontent": true,
        "data-default": true,
        "data-extract": true,
        "data-format": true,
        "data-template": true,
        "data-mime-type": true,
        "data-editable": true,
        "data-literal": true,
        "data-plaintext": true,
        fitcontent() {
            return {
                "data-fitcontent": ""
            }
        },
        default(value) {
            return {
                "data-default": value
            }
        },
        disabled() {
            return {
                disabled: ""
            }
        },
        extract(value) {
            return {
                "data-extract": value
            }
        },
        editable() {
            return {
                "data-editable": ""
            }
        },
        literal() {
            return {
                "data-literal": ""
            }
        },
        format(value) {
            return {
                "data-format": value
            }
        },
        hidden: true,
        readonly() {
            return {
                readonly: ""
            }
        },
        url(value) {
            this.src(value);
            return {
                src: value
            }
        },
        plaintext() {
            return {
                "data-plaintext": ""
            }
        },
        src(value) {
            new URL(value,document.baseURI)
        },
        static:true,
        template(value) {
            return {
                "data-template": value
            }
        },
        title: {
            required: true
        },
        type: {
            default: "text",
            transform(value,node) {
                if(value==="currency-usd") {
                    node.attributes["data-format"] = "$${value}";
                    node.attributes["data-extract"] = "\\$([\\d.]*)";
                    return {
                        type: "text"
                    }
                }
                if(value==="boolean") {
                    return {
                        type: "checkbox"
                    }
                }
                if([
                    "application/json",
                    "text/plain",
                    "text/csv"
                ].includes(value)) {
                    node.attributes["data-mime-type"] = value;
                    return {
                        type: "text"
                    }
                }
            },
            validate(value, node) {
                const values = ["checkbox","color","date","datetime-local","email","file",
                    "hidden","month","number","password","radio","range","tel","text",
                    "time","url","week","currency-usd","boolean",
                    "application/json","text/plain","text/csv"
                ]
                if(!values.includes(value)) {
                    throw new TypeError(`value for script type ${value} must be one of ${JSON.stringify(values)}`);
                }
                return true;
            }
        },
        value: true
    },
    contentAllowed: "*",
    async transform(node) {
        let type = node.attributes.type;
        node.classList.push("secst");
        if(node.attributes.plaintext==null) {
            node.attributes.fitcontent = "";
        }
        if(["application/json","text/plain","text/csv"].includes(type)) {
            node.attributes["data-mime-type"] = type;
            node.skipContent;
            delete node.attributes.type;
        }
        if (node.attributes["data-default"] == null) {
            node.attributes["data-default"] = "";
        }
        const url = node.attributes.url || node.attributes.src;
        if(url) {
            if (node.attributes.static != null) {
                delete node.attributes.static;
                if(node.attributes.editable==null) {
                    node.attributes.disabled = "";
                }
                try {
                    const response = await fetch(url);
                    if (response.status == 200) {
                        try {
                            let text = await response.text();
                            if (type === "application/json") {
                                text = JSON.stringify(JSON5.parse(text), null, 2);
                            }
                            node.attributes.value = text;
                        } catch (e) {
                            node.attributes.value = e + "";
                        }
                    } else {
                        node.value = response.statusText
                    }
                } catch(e) {
                    node.value = e+"";
                }
            } else {
                const f = `await (async () => {
                        try {
                            const response = await fetch("${url}");
                            if(response.status===200) {
                                try {
                                    let text = await response.text();
                                    if("${type}"==="application/json") {
                                        text = JSON.stringify(JSON5.parse(text), null, 2);
                                    }
                                    return text;
                                } catch(e) {
                                    return e+"";
                                }
                            } else {
                                return response.statusText;
                            }
                        } catch(e) {
                            return e+"";
                        }
                        })()`;
                node.attributes["data-template"] = f;
            }
            node.attributes.title ||= url;
            delete node.attributes.url;
        } else {
            node.attributes["data-template"] = node.content.join("").trim();
            node.attributes.value = node.attributes["data-default"];
            node.attributes.title ||=  node.attributes["data-template"];
        }
        if(node.tag==="input") {
            node.content = [];
        }
        return node;
    },
    beforeMount(node) {
        if(node.attributes.hidden!=null) {
            delete node.attributes.hidden;
            node.attributes.style = "display: none;" + (node.attributes.style||"");
        }
        if(node.attributes["data-mime-type"]) {
            node.tag = "textarea";
        } else {
            if(node.attributes["data-plaintext"]!=null) {
                node.tag = "span";
            } else {
                node.tag = "input";
            }
        }
        node.attributes.spellcheck = "false";
        return node;
    },
    connected(el,node) {
        let value =el.getAttribute("value");
        if(node.tag==="textarea") {
            value ||= el.hasAttribute("data-literal") ? el.getAttribute("data-template") : value;
            if(el.innerHTML!==value) {
                el.innerHTML = value;
            }
            el.removeAttribute("value");
            updateValueWidths([el]);
        }
    }
}


export {value,value as default}