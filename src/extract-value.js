const extractValue = (el) => {
    const extract = el.getAttribute("data-extract");
    if(extract) {
        const match = [...el.value.matchAll(new RegExp(extract,"g"))][0];
        if(match) {
            return match[1];
        }
    }
    return el.value;
}

export {extractValue}