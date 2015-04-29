// utils/misc.js

(function(exports) {


    /**
     * This function sends single or multiple adapter functions by calling functions
     * specified in funcs parameter for each adapter associated with the node.
     *
     * funcs parameter is used as a dictionary where each key is used as name of a
     * adapter function to call, and corresponding value is a list of arguments
     * (i.e. must be an array). For example sendAdapterEvent(node, {method : [1,2,3]})
     * will call function 'method' with arguments 1,2,3 for each adapter of the node.
     *
     * @param {Object} node
     * @param {Object} funcs
     * @return {Array} array of all returned values
     */
    exports.callAdapterFunc = function(node, funcs) {
        var result = [];
        if (!node || node._configured === undefined)
            return result;
        var adapters = node._configured.adapters;
        for (var adapter in adapters) {
            for (var func in funcs) {
                var adapterObject = adapters[adapter];
                var eventHandler = adapterObject[func];
                if (eventHandler) {
                    result.push(eventHandler.apply(adapterObject, funcs[func]));
                }
            }
        }
        return result;
    };

    /**
     * This function sends single or multiple adapter events by calling functions
     * specified in events parameter for each adapter associated with the node.
     *
     * events parameter is used as a dictionary where each key is used as name of a
     * adapter function to call, and corresponding value is a list of arguments
     * (i.e. must be an array). For example sendAdapterEvent(node, {method : [1,2,3]})
     * will call function 'method' with arguments 1,2,3 for each adapter of the node.
     *
     * @param {Object} node
     * @param {Object} events
     * @return {Boolean} false if node is not configured.
     */
    exports.sendAdapterEvent = function(node, events) {
        if (!node || node._configured === undefined)
            return false;
        var adapters = node._configured.adapters;
        for (var adapter in adapters) {
            for (var event in events) {
                var eventHandler = adapters[adapter][event];
                if (eventHandler) {
                    eventHandler.apply(adapters[adapter], events[event]);
                }
            }
        }
        return true;
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

    /** Dispatch HTML event
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
            var v = window.XML3D.URIResolver.resolveLocal(ref);
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
        xml3d.activeView = "#" + vid;

        return v;
    };
}(module.exports));
