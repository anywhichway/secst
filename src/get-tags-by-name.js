const getTagsByName = function(node,tagName,results=[]) {
    if(node.content) {
        node.content.reduce((results,item) => {
            if(item.tag===tagName) {
                results.push(item)
            }
            if(item.content) {
                item.content.forEach((node) => {
                    getTagsByName(node,tagName,results);
                })
            }
            return results;
        },results)
    }
    return results;
};

export {getTagsByName, getTagsByName as default}
