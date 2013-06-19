/** @namespace * */
var XML3D = XML3D || {};

/** @define {string} */
XML3D.version = '%VERSION%';
/** @const */
XML3D.xml3dNS = 'http://www.xml3d.org/2009/xml3d';
/** @const */
XML3D.xhtmlNS = 'http://www.w3.org/1999/xhtml';
/** @const */
XML3D.webglNS = 'http://www.xml3d.org/2009/xml3d/webgl';
XML3D._xml3d = document.createElementNS(XML3D.xml3dNS, "xml3d");
XML3D._native = !!XML3D._xml3d.style;
XML3D._parallel = XML3D._parallel != undefined ? XML3D._parallel : false;

XML3D.createElement = function(tagName) {
    return document.createElementNS(XML3D.xml3dNS, tagName);
};

XML3D.extend = function(a, b) {
    for ( var prop in b) {
        if (b[prop] === undefined) {
            delete a[prop];
        } else if (prop !== "constructor" || a !== window) {
            a[prop] = b[prop];
        }
    }
    return a;
};

/**
 * Returns true if ctor is a superclass of subclassCtor.
 * @param ctor
 * @param subclassCtor
 * @return {Boolean}
 */
XML3D.isSuperclassOf = function(ctor, subclassCtor) {
    while (subclassCtor && subclassCtor.superclass) {
        if (subclassCtor.superclass === ctor.prototype)
            return true;
        subclassCtor = subclassCtor.superclass.constructor;
    }
    return false;
}

/**
 *
 * @param {Object} ctor Constructor
 * @param {Object} parent Parent class
 * @param {Object=} methods Methods to add to the class
 * @return {Object!}
 */
XML3D.createClass = function(ctor, parent, methods) {
    methods = methods || {};
    if (parent) {
        /** @constructor */
        var F = function() {
        };
        F.prototype = parent.prototype;
        ctor.prototype = new F();
        ctor.prototype.constructor = ctor;
        ctor.superclass = parent.prototype;
    }
    ctor.isSuperclassOf = XML3D.isSuperclassOf.bind(ctor, ctor);
    for ( var m in methods) {
        ctor.prototype[m] = methods[m];
    }
    return ctor;
};

(function() {
    function displayWebGLNotSupportedInfo(xml3dElement) {

        // Place xml3dElement inside an invisible div
        var hideDiv = document.createElementNS(XML3D.xhtmlNS, 'div');

        xml3dElement.parentNode.insertBefore(hideDiv, xml3dElement);
        hideDiv.appendChild(xml3dElement);
        hideDiv.style.display = "none";

        var infoDiv = document.createElementNS(XML3D.xhtmlNS, 'div');
        infoDiv.setAttribute("class", xml3dElement.getAttribute("class"));
        infoDiv.setAttribute("style", xml3dElement.getAttribute("style"));
        infoDiv.style.border = "2px solid red";
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
        var hTxt = document.createTextNode("Your browser doesn't appear to support XML3D.");
        hElement.appendChild(hTxt);

        var pElement = document.createElement("p");
        pElement.appendChild(document.createTextNode("Please visit "));
        var link = document.createElement("a");
        link.setAttribute("href", "http://www.xml3d.org");
        link.appendChild(document.createTextNode("http://www.xml3d.org"));
        pElement.appendChild(link);
        pElement.appendChild(document.createTextNode(" to get information about browsers supporting XML3D."));
        infoDiv.appendChild(hElement);
        infoDiv.appendChild(pElement);

        hideDiv.parentNode.insertBefore(infoDiv, hideDiv);
    };

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

        if (XML3D._native)
            return;

        if(-1 < curXML3DInitElements.indexOf(xml3dElement))
            return;

        curXML3DInitElements.push(xml3dElement);

        var debug = XML3D.debug.setup();

        if (!(XML3D.webgl && XML3D.webgl.supported())) {
            debug && XML3D.debug.logWarning("Could not initialise WebGL, sorry :-(");
            displayWebGLNotSupportedInfo(xml3dElement);
            curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
            return;
        }

        try {
            XML3D.config.configure(xml3dElement);
        } catch (e) {
            debug && XML3D.debug.logException(e);
            curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
            return;
        }
        try {
            XML3D.webgl.configure(xml3dElement);
        } catch (e) {
            debug && XML3D.debug.logException(e);
            curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
            return;
        }

        // initialize all attached adapters
        XML3D.base.sendAdapterEvent(xml3dElement, {onConfigured : []});

        curXML3DInitElements.splice(curXML3DInitElements.indexOf(xml3dElement), 1);
    };

    /**
     * @param {Element} xml3dElement
     */
    function destroyXML3DElement(xml3dElement)
    {
        if(-1 < curXML3DInitElements.indexOf(xml3dElement))
            return;

        xml3dElement._configured = undefined;

        if(!xml3dElement.parentNode)
            return; // already removed

        var canvas = xml3dElement.parentNode.previousElementSibling;

        var grandParentNode = xml3dElement.parentNode.parentNode;
        if(!grandParentNode)
            return; // subtree containing canvas is not attached, can't remove it

        if(!canvas || canvas.tagName !== "canvas")
            return; // an element we didn't create, skip deletion

        grandParentNode.removeChild(xml3dElement.parentNode);
        grandParentNode.removeChild(canvas);
    };

    /**
     * @param {Event} evt
     */
    function onNodeInserted(evt) {

        if(evt.target.tagName === "xml3d") {
            initXML3DElement(evt.target);
        }
    };

    /**
     * @param {Event} evt
     */
    function onNodeRemoved(evt) {

        if(evt.target.tagName === "xml3d") {
            destroyXML3DElement(evt.target);
        }
    };

    function onLoad() {

        XML3D.css.init();

        var debug = XML3D.debug.setup();
        debug && XML3D.debug.logInfo("xml3d.js version: " + XML3D.version);

        /**
         * Find all the XML3D tags in the document
         * @type {NodeList}
         */
        var xml3ds = document.querySelectorAll("xml3d");

        debug && XML3D.debug.logInfo("Found " + xml3ds.length + " xml3d nodes...");

        if (xml3ds.length && XML3D._native) {
            debug && XML3D.debug.logInfo("Using native implementation.");
            return;
        }

        // TODO: Improve check for xhtml:
        XML3D.xhtml = ( xml3ds[0] && (xml3ds[0].tagName == "xml3d"));

        for(var i = 0; i < xml3ds.length; i++) {
            initXML3DElement(xml3ds[i]);
        }
    };

    function onUnload() {
        if (XML3D.document)
            XML3D.document.onunload();
    };

    window.addEventListener('DOMContentLoaded', onLoad, false);
    window.addEventListener('unload', onUnload, false);
    window.addEventListener('reload', onUnload, false);
    document.addEventListener('DOMNodeInserted', onNodeInserted, false);
    document.addEventListener('DOMNodeRemoved', onNodeRemoved, false);

})();
