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

    var tmpCanvas, tmpContext;

    exports.toImageData = function(imageData) {
        if(imageData instanceof ImageData)
            return imageData;
        if(!imageData.data)
            throw new Error("no data property");
        if(!imageData.width)
            throw new Error("no width property");
        if(!imageData.height)
            throw new Error("no height property");
        if(!tmpContext) {
            tmpCanvas = document.createElement('canvas');
            tmpContext = tmpCanvas.getContext('2d');
        }
        var newImageData = tmpContext.createImageData(imageData.width, imageData.height);
        for(var i = 0; i < imageData.data.length; ++i) {
            var v = imageData.data[i];
            if(v > 255)
                v = 255;
            if(v < 0)
                v = 0;
            newImageData.data[i] = v;
        }
        return newImageData;
    };

    exports.elementIs = function(elem, name) {
        return elem && elem.tagName.toLowerCase() === name;
    };

    exports.encodeZIndex = function(zIndex, isLeafNode) {
        if (zIndex === "auto" || zIndex === "") {
            if (isLeafNode) {
                zIndex = "0"; // Always give leaf nodes an implicit z-index of 0 to ensure they compare properly with negative z-index leaf nodes
            } else {
                return "";
            }
        }
        // Pad with enough zeros to cover the maximum/minimum values (2147483647) for correct string compare results in the sorting step
        zIndex = "0000000000" + zIndex;
        zIndex = zIndex.slice(zIndex.length - 10);
        return zIndex;
    }

}(module.exports));
