const getTagById = function(node,id,results=[]) {
    if(node.content) {
        node.content.reduce((results,item) => {
            if(item.id===id) {
                results.push(item)
            }
            if(item.content) {
                item.content.forEach((node) => {
                    getTagById(node,id,results);
                })
            }
            return results;
        },results)
    }
    return results;
};

export {getTagById, getTagById as default}
