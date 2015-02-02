// utils/misc.js

XML3D.setParameter = function(elementId, fieldName, value) {
    var e = document.getElementById(elementId);
    if (e) {
        var fields = e.childNodes;
        for (var i = 0; i < fields.length; i++) {
              var field = fields[i];
              if (field.nodeType === Node.ELEMENT_NODE && (field.name == fieldName)) {
                  if (typeof value === 'string')
                      {
                          while ( field.hasChildNodes() ) field.removeChild( field.lastChild );
                          field.appendChild(document.createTextNode(value));
                          return true;
                      }
              }
            }
    }
    return false;
};

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(f, fps){
              window.setTimeout(f, 1000 / fps);
            };
  })();

(function(exports) {

    /**
     * Dispatch HTML event
     *
     * @param {Object} target    element or document
     * @param {string} eventType standard event type e.g. load, click
     */
    exports.dispatchEvent = function(target, eventType) {
        var evt = null;
        if (document.createEvent) {
            evt = document.createEvent("Events");
            evt.initEvent(eventType, true, true);
            return target.dispatchEvent(evt);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            return target.fireEvent('on' + eventType, evt);
        }
    };

    /**
     *
     * Dispatch custom HTML event
     *
     * @param {Object} target element or document.
     * @param {string} eventType custom event type.
     * @param {boolean} canBubble Whether the event propagates upward. Sets the value for the bubbles property.
     * @param {boolean} cancelable Whether the event is cancelable and so preventDefault can be called. Sets the value
     *                  for the cancelable property.
     * @param {Object} detail A user-defined object that can contain additional information about the event.
     *                        This parameter can be of any type, or null. This value is returned in the detail property of the event.
     */
    exports.dispatchCustomEvent = function(target, eventType, canBubble, cancelable, detail) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventType, canBubble, cancelable, detail);
        return target.dispatchEvent(event);
    };

    exports.getStyle = function(oElm, strCssRule) {
        var strValue = "";
        if (document.defaultView && document.defaultView.getComputedStyle) {
            strValue = document.defaultView.getComputedStyle(oElm, "")
                    .getPropertyValue(strCssRule);
        } else if (oElm.currentStyle) {
            strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
                return p1.toUpperCase();
            });
            strValue = oElm.currentStyle[strCssRule];
        }

        return strValue;
    };

    /** Evaluates the given XPath expression in the given xml3d element on
     *  xml3d elements and returns the result.
     *
     * @param {!Object} xml3d the xml3d element on which to evaluate the expression
     * @param {!Object} xpathExpr the XPath expression to be evaluated
     *
     * @return {XPathResult} the result of the evaluation
     */
    exports.evaluateXPathExpr = function(xml3d, xpathExpr)
    {
        return document.evaluate(
            xpathExpr, xml3d,
            function() {return XML3D.xml3dNS;},
            XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    };

    var __autoCreatedViewId = 0;
    /**
     * Returns the active view element corresponding to the given xml3d element.
     *
     * @param {!Object} xml3d
     * @return {Object} the active view element
     */
    exports.getOrCreateActiveView = function(xml3d)
    {
        // try to resolve reference
        var ref = xml3d.activeView;
        if(ref)
        {
            var v = XML3D.URIResolver.resolveLocal(ref);
            if(!v)
                throw "XML3D Error: xml3d references view that is not defined: '" + ref + "'.";

            return v;
        }

        // didn't succeed, so now try to just take the first view
        var firstView = xml3d.querySelector("view");
        if(firstView)
        {
            // if it has an id, set it as active
            if(firstView.id && firstView.id.length > 0)
                xml3d.activeView = "#" + firstView.id;

            return firstView;
        }

        // didn't find any: create new one
        XML3D.debug.logWarning("xml3d element has no view defined: creating one.");

        var vid = "xml3d.autocreatedview_" + __autoCreatedViewId++;
        var v = XML3D.createElement("view");
        v.setAttribute("id", vid);

        xml3d.appendChild(v);
        xml3d.setAttribute("activeView", "#" + vid);

        return v;
    };
}(module.exports));
