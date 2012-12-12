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
        // get xml3d wrapper node 
        var wrapper = xml3dEl.parentNode;
        
        if(!XML3D._native)
        {
            /* in the webgl version we have to take the next parent
             * because xml3d gets wrapped in an invisible div first
             * and thus offsetParent below will return null on it at
             * least in WebKit. 
             * see https://developer.mozilla.org/en-US/docs/DOM/element.offsetParent 
             */
            wrapper = wrapper.parentNode;
        }
        
        // calculate offset to root node 
        var offX = wrapper.offsetLeft; 
        var offY = wrapper.offsetTop; 
        
        var node = wrapper; 
        while(node = node.offsetParent)
        {
            offX += node.offsetLeft; 
            offY += node.offsetTop; 
        }
        
        // construct and return result. 
        return {x: pageX - offX, y: pageY - offY};  
    };
}());
