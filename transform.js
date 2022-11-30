import fs from "fs/promises";
import url from "node:url";

import { Window } from 'happy-dom';

global.window = new Window(),
    global.document = window.document;
global.URL = URL;
global.fetch = (url,...args) => {
    if(!url.includes("://")) {
        url = "http://localhost:63342/secst/" + url;
    }
    return window.fetch(url,...args);
}
global.Text = window.Text;
global.MutationObserver = window.MutationObserver;
global.DOMParser = window.DOMParser;
Object.defineProperty(global.document,"baseURI",{configurable:true,writable:true,value:"http://localhost:63342/secst/"});

import peg from "pegjs";
import {transform} from "./src/transform.js";
import {resolve} from "./src/resolve.js";

const text = await fs.readFile("./index.sct",{ encoding: 'utf8' }),
    grammar = await fs.readFile("./src/grammar.txt",{ encoding: 'utf8' }),
    parser = peg.generate(grammar),
    {dom,errors} = await transform(parser,text,{styleAllowed:"*"}),
    script = document.createElement("script");
script.setAttribute("src","./secst.js?run");
dom.head.appendChild(script);
await resolve(dom.body);
await fs.writeFile("./index.html",`<html><head>${dom.head.innerHTML}</head><body>${dom.body.innerHTML}</body></html>`,{ encoding: 'utf8' })
await fs.writeFile("./index.txt",text,{ encoding: 'utf8' })
console.log(errors);


