import JSON5 from "json5";

const formatValue = async (el,value) => {
    const template = el.getAttribute("data-format");
    if(template) {
        return (new Function("value","return `" + template + "`"))(new String((value!=null ? value : await el.rawValue+"").replace(/\$/g,"\$")))
    } else if(el.getAttribute("data-mime-type")==="application/json") {
        try {
            return JSON.stringify(JSON5.parse(value !=null ? value : await el.rawValue), null, 2);
        } catch(e) {
            //console.error(e);
        }
    }
    return value!=null ? value : el.rawValue;
};

export {formatValue}