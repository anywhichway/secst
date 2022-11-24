import fs from "fs/promises";
import url from "node:url";

import { Window } from 'happy-dom';
//import fetch from "cross-fetch";
import peg from "pegjs";

import {transform} from "./src/transform.js";
import {listeners} from "./src/listeners.js";
import {resolve} from "./src/resolve.js";

const grammar = await fs.readFile("./src/grammar.txt",{ encoding: 'utf8' })

const parser = peg.generate(grammar);

global.window = new Window(),
global.document = window.document;
global.URL = URL;
global.fetch = window.fetch;
global.Text = window.Text;
global.MutationObserver = window.MutationObserver;

// document.baseURI

const text = await fs.readFile("./markup.txt",{ encoding: 'utf8' }),
    {dom,errors} = await transform(parser,text,{styleAllowed:"*"}),
    script = document.createElement("script");
script.setAttribute("src","./secst.js?run");
dom.head.appendChild(script);
await resolve(dom.body);
await fs.writeFile("./markup.html",`<html><head>${dom.head.innerHTML}</head><body>${dom.body.innerHTML}</body></html>`,{ encoding: 'utf8' })

