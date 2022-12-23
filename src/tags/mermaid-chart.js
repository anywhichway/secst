const mermaidChart = {
    htmlDocLink: "",
    contentAllowed: true,
    requires: [
        {
            tag: "script",
            attributes: {
                src: "https://cdn.jsdelivr.net/npm/mermaid@9/dist/mermaid.min.js",
                onload: "(() => { mermaid.initialize({ startOnLoad: true }) })()"
            }
        }
    ],
    transform(node) {
        node.id ||= "mermaidChart" + (Math.random()+"").substring(2);
        return node;
    },
    beforeMount(node) {
        node.tag = "pre";
        node.classList.push("mermaid")
        return node;
    },
    toInnerHTML(node) {
       return  node.content.join("");
    },
    connected(el,node) {
        const script = document.createElement("script");
        script.setAttribute("type","module");
        script.innerHTML = `
            const el = document.getElementById("${node.id}"),
                sibling = el.nextSibling,
                insertSvg = function (svgCode, bindFunctions) {
                    el.innerHTML = svgCode;
                    if(!el.isConnected) {
                        sibling.parentElement.insertBefore(el,sibling);
                    }
                };
            const graphDefinition = \`${node.content.join("")}\`;
            setTimeout(() => mermaid.mermaidAPI.render("${node.id}", graphDefinition, insertSvg),1000);
        `;
        el.insertAdjacentElement("afterend",script);
    }
}

export {mermaidChart,mermaidChart as default}