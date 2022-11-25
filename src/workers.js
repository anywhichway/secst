const body = `const properties = {};
    let document;
    self.addEventListener('message',async (event) => {
    const directive = JSON.parse(event.data);
    let result;
      // debugger;
    try {
        if(directive.type==="importScripts") {
            self.importScripts(...directive.args);
        } else if(directive.type==="freeze") {
           Object.freeze(properties);
        } else if(directive.type==="delete") {
            const [propertyName] = directive.args;
            delete properties[propertyName];
        } else if(directive.type==="get") {
            const [propertyName] = directive.args;
            result = properties[propertyName];
        } else if(directive.type==="set") {
            const [propertyName,value] = directive.args;
            const valueType = directive.valueType;
            properties[propertyName] = valueType==="function" ? (new Function("return " + value))() : value;
            document = properties.document;
        }  else if(directive.type==="apply") {
            const [propertyName,...args] = directive.args;
            result = await properties[propertyName](...args);
        }
    } catch(e) {
        result = e+"";
    }
    if(typeof(result)==="function") {
        result = "()=>{}";
    }
    if([Infinity,-Infinity,NaN,undefined].some((value) => value+""===result+"")) {
        result += "";
    }
    self.postMessage(JSON.stringify({eventId:directive.eventId,value:result}))
})`;
const GenericWorker = async ({properties={},imports=[],freeze,timeout=1000,name="anonymous",timeoutRestart=true,type}={}) => {
    const url = URL.createObjectURL(new Blob([body], {type: 'application/javascript'})),
        createTimeout = (promise,reject) => {
            return setTimeout(() => {
                const error = new EvalError(`Restarted worker ${name} on timeout of ${timeout}ms`);
                console.error(error);
                worker.terminate();
                if(timeoutRestart) {
                    worker = new Worker(url);
                }
                reject(error);
            },timeout);
        },
        coerce = (value,property) => {
            if(!value) return value;
            if(typeof(value)==="string") {
                if(value==="()=>{}") {
                    return async (...args) => {
                        await promise;
                        promise = new Promise((resolve,reject) => {
                            const timeout = createTimeout(promise, reject),
                                id = Math.random(),
                                listener = (event) => {
                                    const {value, eventId} = JSON.parse(event.data);
                                    if (eventId !== id) return;
                                    worker.removeEventListener("message", listener)
                                    clearTimeout(timeout);
                                    resolve(coerce(value, property));
                                };
                            worker.addEventListener("message", (event) => {
                                listener(event);
                            });
                            worker.postMessage(JSON.stringify({type:"apply",args:[property,...args],eventId:id}));
                        })
                        return await promise;
                    }
                }
                try {
                    value = JSON.parse(value);
                    if(value==="Infinity") return Infinity;
                    if(value==="-Infinity") return -Infinity;
                    if(value==="NaN") return NaN;
                    if(value==="undefined") return undefined;
                    return value;
                } catch(e) {
                    return value;
                }
            }
            return value;
        };
    let promise,
        worker = new Worker(url,{type});
    const functions = {
        async delete(property) {
            await promise;
            return promise = new Promise((resolve,reject) => {
                const timeout = createTimeout(promise,reject);
                const listener = (event) => {
                    worker.removeEventListener("message",listener)
                    clearTimeout(timeout);
                    const value = JSON.parse(event.data);
                    resolve(coerce(value,property));
                }
                worker.addEventListener("message",(event) => {
                    listener(event);
                });
                worker.postMessage(JSON.stringify({type:"delete",args:[property]}));
            });
        },
        async freeze() {
            await promise;
            return promise = new Promise((resolve,reject) => {
                const timeout = createTimeout(promise,reject);
                const listener = (event) => {
                    worker.removeEventListener("message",listener)
                    clearTimeout(timeout);
                    const value = JSON.parse(event.data);
                    resolve(coerce(value));
                }
                worker.addEventListener("message",(event) => {
                    listener(event);
                });
                worker.postMessage(JSON.stringify({type:"freeze"}));
            });
        },
        async get(property) {
            if(promise && property==="then") {
                return promise.then;
            }
            await promise;
            return promise = new Promise((resolve,reject) => {
                const timeout = createTimeout(promise, reject),
                    id = Math.random(),
                    listener = (event) => {
                        const {value, eventId} = JSON.parse(event.data);
                        if (eventId !== id) return;
                        worker.removeEventListener("message", listener)
                        clearTimeout(timeout);
                        resolve(coerce(value, property));
                    };
                worker.addEventListener("message", (event) => {
                    listener(event);
                });
                worker.postMessage(JSON.stringify({type: "get", args: [property], eventId: id}));
            });
        },
        async importScripts(...scripts) {
            await promise;
            return promise = new Promise((resolve,reject) => {
                const timeout = createTimeout(promise, reject),
                    id = Math.random(),
                    listener = (event) => {
                        const {value, eventId} = JSON.parse(event.data);
                        if (eventId !== id) return;
                        worker.removeEventListener("message", listener)
                        clearTimeout(timeout);
                        resolve(coerce(value));
                    };
                worker.addEventListener("message", (event) => {
                    listener(event);
                });
                worker.postMessage(JSON.stringify({type:"importScripts",args:scripts,eventId:id}));
            });
        },
        async set(property,value,valueType=typeof(value)) {
            await promise;
            return promise = new Promise((resolve,reject) => {
                const timeout = createTimeout(promise, reject),
                    id = Math.random(),
                    listener = (event) => {
                        const {value, eventId} = JSON.parse(event.data);
                        if (eventId !== id) return;
                        worker.removeEventListener("message", listener)
                        clearTimeout(timeout);
                        resolve(coerce(value, property));
                    };
                worker.addEventListener("message", (event) => {
                    listener(event);
                });
                if(valueType==="function") {
                    value += "";
                }
                worker.postMessage(JSON.stringify({type:"set",args:[property,value],valueType,eventId:id}));
            });
        },
        async call(property,...args) {
            return (await this.get(property))(...args);
        },
        async apply(property,args) {
            return (await this.get(property))(...args);
        }
    }
    for(const [propertyName,value] of Object.entries(properties)) {
        await functions.set(propertyName,value);
    }
    if(imports.length>0) {
        await functions.importScripts(...imports)
    }
    if(freeze) {
        await functions.freeze();
    }
    return new Proxy(functions,{
        async get(target,property) {
            let value = target[property];
            if(value!==undefined) return value;
            return target.get(property);
        },
        async set(target,property) {
            const value = target[property];
            if(value!==undefined) {
                throw new Error(`Can't set primary property ${property} on worker ${name}` )
            }
            return target.set(property,value);
        },
        async delete(target,property) {
            let value = target[property];
            if(value!==undefined) {
                throw new Error(`Can't delete primary property ${property} on worker ${name}` )
            }
            await target.delete(property);
        }
    })
}

export {GenericWorker}