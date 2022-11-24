const formatValue = (el) => {
    const template = el.getAttribute("data-format");
    if(template) {
        return (new Function("value","return `" + template + "`"))(new String(el.rawValue.replace(/\$/g,"\$")))
    }
    return el.rawValue;
};

export {formatValue}