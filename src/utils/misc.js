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

(function() {
    
    if(!XML3D.util) 
        XML3D.util = {};
    
    var u = XML3D.util; 
    
    /**
     * Dispatch HTML event
     *
     * @param {Object} target    element or document
     * @param {string} eventType standard event type e.g. load, click
     */
    u.dispatchEvent = function(target, eventType) {
        var evt = null;
        if (document.createEvent) {
            evt = document.createEvent("Events");
            evt.initEvent(eventType, true, true);
            target.dispatchEvent(evt);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            target.fireEvent('on' + eventType, evt);
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
    u.dispatchCustomEvent = function(target, eventType, canBubble, cancelable, detail) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventType, canBubble, cancelable, detail);
        target.dispatchEvent(event);
    };
    
    u.getStyle = function(oElm, strCssRule) {
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
    u.evaluateXPathExpr = function(xml3d, xpathExpr)
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
    u.getOrCreateActiveView = function(xml3d)
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
        var firstView = XML3D.util.evaluateXPathExpr(
                xml3d, './/xml3d:view[1]').singleNodeValue;
        
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
    
    /** Calculate the offset of the given element and return it.
     *
     *  @param {Object} element
     *  @return {{top:number, left:number}} the offset
     *
     *  This code is taken from http://javascript.info/tutorial/coordinates .
     *  We don't want to do it with the offsetParent way, because the xml3d
     *  element is actually invisible and thus offsetParent will return null
     *  at least in WebKit. Also it's slow. So we use getBoundingClientRect().
     *  However it returns the box relative to the window, not the document.
     *  Thus, we need to incorporate the scroll factor. And because IE is so
     *  awesome some workarounds have to be done and the code gets complicated.
     */
    function calculateOffset(element)
    {
        var box = element.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;

        // get scroll factor (every browser except IE supports page offsets)
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

        // the document (`html` or `body`) can be shifted from left-upper corner in IE. Get the shift.
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        // for Firefox an additional rounding is sometimes required
        return {top: Math.round(top), left: Math.round(left)};
    }

    /** Convert a given mouse page position to be relative to the given target element.
     *  Most probably the page position are the MouseEvent's pageX and pageY attributes.
     *  The result are the proper coordinates to be given to e.g.
     *  the <xml3d>'s getElementByPoint() method.
     *
     *  @param {!Object} xml3dEl the xml3d element to which the coords need to be translated
     *  @param {!number} pageX the x-coordinate relative to the page
     *  @param {!number} pageY the y-coordinate relative to the page
     *  @return {{x: number, y: number}} the converted coordinates
     */
    u.convertPageCoords = function(xml3dEl, pageX, pageY)
    {
        var off = calculateOffset(xml3dEl);

        return {x: pageX - off.left, y: pageY - off.top};
    };
}());
