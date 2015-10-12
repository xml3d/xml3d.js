var XML3D = require("./global.js").XML3D;
var Config = require("./interface/elements.js").config;
var sendAdapterEvent = require("./utils/misc.js").sendAdapterEvent;
var Options = require("./utils/options.js");
var CSS = require("./utils/css.js");
var ConfigureRenderer = require("./renderer/renderer/configure.js");
var WebglSupported = require("./renderer/webgl/base/utils.js").supported;
require("./interface/dom.js");
require("./utils/debug.js");

(function () {
    if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
        var m = document.createElement("meta");
        m.name = "format-detection";
        m.content = "telephone=no";
        document.head.appendChild(m)
    }
}());

function displayWebGLNotSupportedInfo(xml3dElement){

    if(xml3dElement.hasAttribute("onunsupported")){
        var callback = new Function("event", xml3dElement.getAttribute("onunsupported"));
        xml3dElement.addEventListener('unsupported', callback, false);
    }
    var doDefault = XML3D.util.dispatchCustomEvent(xml3dElement, 'unsupported', false, true, null);
    if(doDefault){
        // Place xml3dElement inside an invisible div
        var hideDiv = document.createElementNS(XML3D.xhtmlNS, 'div');

        xml3dElement.parentNode.insertBefore(hideDiv, xml3dElement);
        hideDiv.appendChild(xml3dElement);
        //hideDiv.style.display = "none";

        var infoDiv = document.createElementNS(XML3D.xhtmlNS, 'div');
        if(xml3dElement.hasAttribute("class")){
            infoDiv.setAttribute("class", xml3dElement.getAttribute("class"));
        }

        infoDiv.setAttribute("style", xml3dElement.getAttribute("style"));
        infoDiv.style.border = "2px solid red";
        infoDiv.style.fontFamily = "verdana,sans-serif";
        infoDiv.style.color = "red";
        infoDiv.style.padding = "10px";
        infoDiv.style.backgroundColor = "rgba(255, 0, 0, 0.3)";

        var width = xml3dElement.getAttribute("width");
        if (width !== null) {
            infoDiv.style.width = width;
        }

        var height = xml3dElement.getAttribute("height");
        if (height !== null) {
            infoDiv.style.height = height;
        }

        var hElement = document.createElement("h3");
        var hTxt = document.createTextNode("Sorry, your browser doesn't appear to support XML3D.");
        hElement.appendChild(hTxt);

        var pElement = document.createElement("p");
        pElement.appendChild(document.createTextNode("Please visit "));
        var link = document.createElement("a");
        link.setAttribute("href", "http://www.xml3d.org/help");
        link.appendChild(document.createTextNode("http://www.xml3d.org/help"));
        pElement.appendChild(link);
        pElement.appendChild(document.createTextNode(" for more information."));
        infoDiv.appendChild(hElement);
        infoDiv.appendChild(pElement);

        hideDiv.parentNode.insertBefore(infoDiv, hideDiv);
    }

}

/*  a list of elements that are currently initialized. More specifically,
 *  they're currently in a call to the method below.
 *
 *  Why?
 *  In webgl we actually reattach the xml3d element in the DOM. Thus, when
 *  we're in the middle of working on a onNodeInserted event, there will probably
 *  come right another event which we actually don't care for.
 *  So we use this list to keep track of which elements are currently initializing.
 */
var curXML3DInitElements = [];

/**
 * @param {Element} xml3dElement
 */
function initXML3DElement(xml3dElement) {
    if(-1 < curXML3DInitElements.indexOf(xml3dElement))
        return;

    curXML3DInitElements.push(xml3dElement);

    var debug = XML3D.debug.setup();

    if (!WebglSupported()) {
        debug && XML3D.debug.logWarning("Could not initialise WebGL, sorry :-(");
        displayWebGLNotSupportedInfo(xml3dElement);
        curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
        return;
    }

    XML3D.debug.logInfo("Configuring", xml3dElement.querySelectorAll("*").length, "elements");

    try {
        Config.configure(xml3dElement);
    } catch (e) {
        debug && XML3D.debug.logException(e);
        curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
        return;
    }
    try {
        ConfigureRenderer(xml3dElement);
    } catch (e) {
        debug && XML3D.debug.logException(e);
        curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
        return;
    }

    // initialize all attached adapters
    sendAdapterEvent(xml3dElement, {onConfigured : []});

    curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
    clearObserver();
}

/**
 * @param {Element} xml3dElement
 */
function destroyXML3DElement(xml3dElement)
{
    if(-1 < curXML3DInitElements.indexOf(xml3dElement))
        return;

    xml3dElement._configured.destroy();
    xml3dElement._configured = undefined;

    if(!xml3dElement.parentNode)
        return; // already removed

    var canvas = xml3dElement.parentNode.previousElementSibling;

    var grandParentNode = xml3dElement.parentNode.parentNode;
    if(!grandParentNode)
        return; // subtree containing canvas is not attached, can't remove it

    if(!canvas || canvas.tagName.toLowerCase() !== "canvas")
        return; // an element we didn't create, skip deletion

    grandParentNode.removeChild(canvas);
}

/**
 * @param {Event} evt
 */
function onNodeInserted(evt) {

    if(evt.target.tagName === "xml3d") {
        initXML3DElement(evt.target);
    }
}

/**
 * @param {Event} evt
 */
function onNodeRemoved(evt) {

    if(evt.target.tagName === "xml3d") {
        destroyXML3DElement(evt.target);
    }
}

var observer = null;

function onLoad() {

    Options.setOptionsFromQuery();

    CSS.init();

    var debug = XML3D.debug.setup();
    debug && XML3D.debug.logInfo("xml3d.js version: " + XML3D.version);

    /**
     * Find all the XML3D tags in the document
     * @type {NodeList}
     */
    var xml3ds = document.querySelectorAll("xml3d");

    debug && XML3D.debug.logInfo("Found " + xml3ds.length + " xml3d node(s)");

    for(var i = 0; i < xml3ds.length; i++) {
        initXML3DElement(xml3ds[i]);
    }

    // TODO(ksons): Remove this, no MutationObserver no XML3D
    if(!MutationObserver){
        document.addEventListener('DOMNodeInserted', onNodeInserted, false);
        document.addEventListener('DOMNodeRemoved', onNodeRemoved, false);
    }
    else{
        observer = new MutationObserver(resolveMutations);
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: [ "class", "id", "style" ] } );
    }
}

function onUnload() {
    if (XML3D.document)
        XML3D.document.onunload();
}



function resolveMutations(mutations){
    for(var i = 0; i < mutations.length; ++i){
        var mutation = mutations[i];
        if(mutation.type == 'childList'){
            mapFunctionOnXML3DElements(mutation.addedNodes, initXML3DElement);
            mapFunctionOnXML3DElements(mutation.removedNodes, destroyXML3DElement);

        } else if (mutation.type == 'attributes') {
            var mutationTarget = mutation.target;
            if (mutation.attributeName === "id" || mutation.attributeName === "class")
                mutationTarget = mutation.target.parentNode;
            var cssTarget = mutationTarget._configured ? mutationTarget : mutationTarget.querySelector("xml3d");
            if(cssTarget && cssTarget._configured) { // xml3d is a child node
                var adaptersNames = Object.keys(cssTarget._configured.adapters).filter(function(a) {
                    return a.indexOf("webgl") == 0;
                });
                adaptersNames.map(function(name){return cssTarget._configured.adapters[name];}).forEach(function(renderAdapter) {
                    renderAdapter.traverse(function(adapter) {
                        adapter.styleChangedCallback();
                    })

                });

            }

        }
    }
}

function mapFunctionOnXML3DElements(elementList, fun) {
    Array.forEach(elementList, function(element) {
        if (!element.getElementsByTagNameNS) {
            // These elements are leaf nodes (eg. TEXT) so we can ignore them
            return;
        }
        if (element.tagName.toLowerCase() === "xml3d") {
            fun(element);
            // An XML3D element can't have further XML3D elements as children
            return;
        }
        // For cases where an XML3D element might be inside the subtree of the added node
        var xml3dElems = element.getElementsByTagName("xml3d");
        xml3dElems = xml3dElems.length ? xml3dElems : element.getElementsByTagNameNS(XML3D.xml3dNS, "xml3d");

        Array.forEach(xml3dElems, fun);
    });
}

XML3D.flushCSSChanges = function(){
    if(observer){
        resolveMutations(observer.takeRecords());
    }
};

function clearObserver(){
    if(observer){
        observer.takeRecords();
    }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    onLoad();
} else {
    document.addEventListener('DOMContentLoaded', onLoad, false);
}

window.addEventListener('unload', onUnload, false);
window.addEventListener('reload', onUnload, false);

module.exports = XML3D;

