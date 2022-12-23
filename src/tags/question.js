import Tag from "../tag.js";
import phrasingContent from "./phrasing-content.js";
import value from "./value.js";

const question = {
    htmlDocLink: "",
    attributesAllowed: {
        "show-answer": true,
        type: ["checkbox","color","date","datetime-local","email","file",
        "hidden","month","number","password","radio","range","tel","text",
        "time","url","week","currency-usd","boolean"],
        showanswer(value) {
            try {
                value = JSON.parse(value)
            } catch(e) {

            }
            return {
                "data-showanswer": !!value
            }
        }
    },
    contentAllowed: {
        text: {
            contentAllowed: {
                ...phrasingContent
            },
            beforeMount(node) {
                node.tag = "label";
                return node;
            }
        },
        answer: {
            attributesAllowed: {
                "data-literal": true,
                type: ["hidden"],
                value: true,
                literal() {
                    return {
                        "data-literal": ""
                    }
                }
            },
            contentAllowed:true,
            beforeMount(node) {
                node.tag = "input";
                node.attributes.type = "hidden";
                node.attributes.value = node.content.join("");
                node.content = [];
                return node;
            }
        },
        value
    },
    transform(node) {
        const [text,answer] = node.content.filter((item) => item && typeof(item)==="object");
        node.content = [text," ",new Tag({tag:"value",
            options:{
                id: node.id,
                attributes:{
                    type:node.attributes.type,
                    editable: ""
                }
            }
        })," &check;",answer]
        node.classList.push("secst-question");
        delete node.attributes.type;
        delete node.id;
        return node;
    },
    beforeMount(node) {
        node.tag = "div";
        return node;
    },
    listeners: {
        change: async function(event) {
            const {target,currentTarget} = event;
            let value;
            try {
                value = JSON5.parse(target.value)
            } catch(e) {
                value = target.value;
            }
            const answer = currentTarget.querySelector('input[type="hidden"]'),
                template = answer.value,
                result = answer.hasAttribute("data-literal") ? template : await SECST.stringTemplateEval(template),
                type = typeof(result);
            if(value!=="" && result!=value) {
                currentTarget.classList.add("secst-error");
                if(currentTarget.lastChild.nodeType!==Node.TEXT_NODE && currentTarget.getAttribute("data-showanswer")==="true") {
                    currentTarget.appendChild(new Text(" Correct Answer: " + (type==="string" ? result : JSON.stringify(result))));
                }
            } else {
                currentTarget.classList.remove("secst-error");
                while(currentTarget.lastChild.nodeType===Node.TEXT_NODE) {
                    currentTarget.lastChild.remove()
                }
            }
        }
    }
}

export {question,question as default}