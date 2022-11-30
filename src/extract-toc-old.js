const extractTocOld = (startNode) => {
    const h1 = document.createElement("h1");
    h1.innerText = "Table of Contents";
    return h1;
}

export {extractTocOld}