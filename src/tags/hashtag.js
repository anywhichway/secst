const hashtag = {
    htmlDocLink: "",
    contentAllowed: true,
    transform(node) {
        // push to meta tags here
        return node;
    },
    toText(node) {
        return node.content.reduce((tags,item) => {
            item.split(" ").forEach((tag) => tags.push("#" + tag));
            return tags;
        },[]).join(", ")
    },
    connected(el) {
        const tags = el.innerText.split(","),
            meta = document.createElement("meta");
        meta.setAttribute("name","keywords");
        meta.setAttribute("value",tags.join(","))
        document.head.appendChild(meta)
    }
}

export {hashtag,hashtag as default}