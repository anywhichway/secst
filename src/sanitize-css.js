let iframe;

function sanitizeCSS(css) {
    iframe ||= document.createElement("iframe");
    iframe.setAttribute("title","cssSanitizer");
    iframe.style.display = "none";
    iframe.style.width = "10px";
    iframe.style.height = "10px";
    if(!iframe.isConnected) {
        document.body.appendChild(iframe);
    }
    iframe.contentDocument ||= document; /// handles server side processing
    const style = iframe.contentDocument.createElement('style');
    style.innerHTML = css;
    iframe.contentDocument.head.appendChild(style);
    const result = Array.from(style.sheet.cssRules).map(rule => rule.cssText || '').join('\n');
    style.remove();
    //iframe.remove();
    return result;
}

export {sanitizeCSS, sanitizeCSS as default}