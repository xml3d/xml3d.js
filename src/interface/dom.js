// dom.js

(function($) {
    if ($)
        return;
    var doc = {};
    var nativeGetElementById = document.getElementById;
    doc.getElementById = function(id) {
        var elem = nativeGetElementById.call(this, id);
        if (elem) {
            return elem;
        } else {
            var elems = this.getElementsByTagName("*");
            for ( var i = 0; i < elems.length; i++) {
                var node = elems[i];
                if (node.getAttribute("id") === id) {
                    return node;
                }
            }
        }
        return null;
    };
    var nativeCreateElementNS = document.createElementNS;
    doc.createElementNS = function(ns, name) {
        var r = nativeCreateElementNS.call(this, ns, name);
        if (ns == XML3D.xml3dNS) {
            XML3D.config.element(r, true);
        }
        return r;
    };
    XML3D.extend(window.document, doc);

}(XML3D._native));

/*
 * Workaround for DOMAttrModified issues in WebKit based browsers:
 * https://bugs.webkit.org/show_bug.cgi?id=8191
 */
if (navigator.userAgent.indexOf("WebKit") != -1) {
    var attrModifiedWorks = false;
    var listener = function() {
        attrModifiedWorks = true;
    };
    document.documentElement.addEventListener("DOMAttrModified", listener, false);
    document.documentElement.setAttribute("___TEST___", true);
    document.documentElement.removeAttribute("___TEST___");
    document.documentElement.removeEventListener("DOMAttrModified", listener, false);

    if (!attrModifiedWorks) {
        Element.prototype.__setAttribute = HTMLElement.prototype.setAttribute;

        Element.prototype.setAttribute = function(attrName, newVal) {
            var prevVal = this.getAttribute(attrName);
            this.__setAttribute(attrName, newVal);
            newVal = this.getAttribute(attrName);
            // if (newVal != prevVal)
            {
                var evt = document.createEvent("MutationEvent");
                evt.initMutationEvent("DOMAttrModified", true, false, this, prevVal || "", newVal || "", attrName, (prevVal == null) ? MutationEvent.ADDITION
                        : MutationEvent.MODIFICATION);
                this.dispatchEvent(evt);
            }
        };

        Element.prototype.__removeAttribute = HTMLElement.prototype.removeAttribute;
        Element.prototype.removeAttribute = function(attrName) {
            var prevVal = this.getAttribute(attrName);
            this.__removeAttribute(attrName);
            var evt = document.createEvent("MutationEvent");
            evt.initMutationEvent("DOMAttrModified", true, false, this, prevVal, "", attrName, MutationEvent.REMOVAL);
            this.dispatchEvent(evt);
        };
    }
}
