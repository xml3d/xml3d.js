// utils/misc.js

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
