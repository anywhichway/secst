//import { init, SearchIndex } from "emoji-mart";
/*import * as all from "emoji-mart";
let { init, SearchIndex } = all;
if(init==null) {
    init = all.default.init;
    SearchIndex = all.default.SearchIndex;
}*/

const {init,SearchIndex} = emojiMart;

let emojiMartData;
const emoji = {
    attributesAllowed: {
        greyscale() {
            return {
                filter: "grayscale(100%)"
            }
        },
        grayscale() {
            return {
                filter: "grayscale(100%)"
            }
        },
        filter: "string"
    },
    contentAllowed: true,
    async toElement(node) {
        emojiMartData ||= await fetch(
            'https://cdn.jsdelivr.net/npm/@emoji-mart/data',
        ).then((response) => response.json());
        init({emojiMartData});
        const emojis = []
        for(const item of node.content) {
            for(const tag of item.split(" ")) {
                try {
                    const found = await SearchIndex.search(tag);
                    if(found[0]?.id===tag) {
                        const unified = found[0].skins[0].unified;
                        emojis.push("&#x" + unified.split("-").shift() + ";")
                        //emojis.push(found[0].skins[0].native)
                    } else {
                        emojis.push(":" + tag)
                    }
                } catch(e) {
                    console.log("emoji error",e)
                }
            }
        }
        const span = document.createElement("span");
        span.style.filter = node.attributes.filter  || "";
        span.innerHTML = emojis.join(" ");
        return span;
    }
}

export {emoji,emoji as default}