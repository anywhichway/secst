import JSON5 from "json5";

const formatValue = (el) => {
    const template = el.getAttribute("data-format");
    if(template) {
        return (new Function("value","return `" + template + "`"))(new String((el.rawValue+"").replace(/\$/g,"\$")))
    } else if(el.getAttribute("data-mime-type")==="application/json") {
        try {
            return JSON.stringify(JSON5.parse(el.rawValue), null, 2);
        } catch(e) {
            console.error(e);
        }
    }
    return el.rawValue;
};

export {formatValue}