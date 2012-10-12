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
 *
 * @param {Object} ctor Constructor
 * @param {Object} parent Parent class
 * @param {Object=} methods Methods to add to the class
 * @returns
 */
XML3D.createClass = function(ctor, parent, methods) {
    methods = methods || {};
    if (parent) {
        var F = function() {
        };
        F.prototype = parent.prototype;
        ctor.prototype = new F();
        ctor.prototype.constructor = ctor;
        ctor.superclass = parent.prototype;
    }
    for ( var m in methods) {
        ctor.prototype[m] = methods[m];
    }
    return ctor;
};
(function() {
    var onload = function() {

        XML3D.css.init();

        var debug = XML3D.debug.setup();
        debug && XML3D.debug.logInfo("xml3d.js version: " + XML3D.version);

        // Find all the XML3D tags in the document
        var xml3ds = document.querySelectorAll("xml3d");
        xml3ds = Array.map(xml3ds, function(n) {
            return n;
        });

        debug && XML3D.debug.logInfo("Found " + xml3ds.length + " xml3d nodes...");

        if (xml3ds.length) {
            if (XML3D._native) {
                debug && XML3D.debug.logInfo("Using native implementation.");
                return;
            }
        }

        if (!(XML3D.webgl && XML3D.webgl.supported())) {
            debug && XML3D.debug.logWarning("Could not initialise WebGL, sorry :-(");

            for ( var i = 0; i < xml3ds.length; i++) {
                // Place xml3dElement inside an invisible div
                var hideDiv = document.createElementNS(XML3D.xhtmlNS, 'div');
                var xml3dElement = xml3ds[i];

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
            }

            return;
        }

        try {
            XML3D.config.configure(xml3ds);
        } catch (e) {
            debug && XML3D.debug.logError("Error initalizing interfaces: " + e);
        }
        try {
            XML3D.webgl.configure(xml3ds);
        } catch (e) {
            debug && XML3D.debug.logError("Error initalizing webgl: " + e);
        }

        var ready = (function(eventType) {
            var evt = null;
            if (document.createEvent) {
                evt = document.createEvent("Events");
                evt.initEvent(eventType, true, true);
                document.dispatchEvent(evt);
            } else if (document.createEventObject) {
                evt = document.createEventObject();
                document.fireEvent('on' + eventType, evt);
            }
        })('load');
    };
    var onunload = function() {
        if (XML3D.document)
            XML3D.document.onunload();
    };
    window.addEventListener('DOMContentLoaded', onload, false);
    window.addEventListener('unload', onunload, false);
    window.addEventListener('reload', onunload, false);

})();
