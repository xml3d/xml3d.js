var events = require("./notification.js");
var ClassInfo = require("./configuration.js").classInfo;
require("../utils/array.js");

var MutationObserver = (window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver),
    mutObserver;

if(MutationObserver){
    mutObserver = new MutationObserver(handleMutations);
} else {
    XML3D.debug.logError("XML3D requires MutationObservers, which your browser does not support. Please consider upgrading to a newer version.");
    mutObserver = {
        takeRecords:function(){return []},
        observe: function(a,b) {}
    }
}

XML3D.flushDOMChanges = function(){
    var records = mutObserver.takeRecords();
    records.length && handleMutations(records);
};

function handleMutations(mutations) {
    for(var i = 0; i < mutations.length; ++i){
        var mutationRecord = mutations[i];
        if (mutationRecord.type === 'attributes') {
            handleAttributeChanged(mutationRecord);
        } else if (mutationRecord.type === 'childList') {
            handleChildListChanged(mutationRecord);
        } else if(mutationRecord.type == 'characterData'){
            handleCharacterDataChanged(mutationRecord);
        }
    }
}

function handleCharacterDataChanged(mutation) {
    var target = mutation.target;
    while(!target._configured && target.parentElement) {
        target = target.parentElement;
    }
    var elementHandler = target._configured;
    if (!elementHandler) {
        return;
    }
    var n = new events.NotificationWrapper(mutation, events.VALUE_MODIFIED, target);
    elementHandler.handlers.value.resetValue(elementHandler.storage);
    elementHandler.notify(n);
}

function handleChildListChanged(mutation) {
    var addedNodes = mutation.addedNodes;
    for (var i = 0; i < addedNodes.length; i++) {
        if (addedNodes[i].nodeType === Node.TEXT_NODE){
            // This may have been the value of eg. a float3 element, we should treat it as a characterDataChanged event
            handleCharacterDataChanged(mutation);
            continue;
        }
        handleNodeInserted(addedNodes[i], mutation);
    }

    var removedNodes = mutation.removedNodes;
    for (var i=0; i < removedNodes.length; i++) {
        if (removedNodes[i].nodeType === Node.TEXT_NODE){
            continue; // characterDataChanged events were already handled in addedNodes
        }
        handleNodeRemoved(removedNodes[i], mutation);
    }
}

function handleNodeInserted(node, mutation) {
    var targetHandler = mutation.target._configured;
    if (!targetHandler) {
        return;
    }
    config.element(node);
    addRecursive(node);
    var n = new events.NotificationWrapper(mutation, events.NODE_INSERTED, node);
    targetHandler.notify(n);
}

function handleNodeRemoved(node, mutation) {
    var targetHandler = mutation.target._configured;
    if (!targetHandler) {
        return;
    }
    var n = new events.NotificationWrapper(mutation, events.NODE_REMOVED, node);
    targetHandler.notify(n);
    if(node._configured) {
        n.type = events.THIS_REMOVED;
        removeRecursive(node, n);
        notifyNodeIdChangeRecursive(node);
    } else if (node.nodeType === Node.TEXT_NODE){
        // This may have been the value of eg. a float3 element, we should also treat it as a characterDataChanged event
        handleCharacterDataChanged(mutation);
    }
}

function notifyNodeIdChangeRecursive(element){
    XML3D.base.resourceManager.notifyNodeIdChange(element, element.id, null);
    var n = element.firstElementChild;
    while(n) {
        notifyNodeIdChangeRecursive(n);
        n = n.nextElementSibling;
    }
}

function removeRecursive(element, evt) {
    if(element._configured) {
        element._configured.notify(evt);
        element._configured.remove(evt);
    }
    var child = element.firstElementChild;
    while(child) {
        removeRecursive(child, evt);
        child = child.nextElementSibling;
    }
}

function addRecursive(element){
    var n = element.firstElementChild;
    while(n) {
        addRecursive(n);
        n = n.nextElementSibling;
    }
    // We call this here in addition to nodeInsertedIntoDocument, since the later is not supported by Firefox
    XML3D.base.resourceManager.notifyNodeIdChange(element, null, element.id);
}

function handleAttributeChanged(mutation) {
    var target = mutation.target;
    var elementHandler = target._configured;
    if (!elementHandler) {
        return;
    }
    var attributeHandler = elementHandler.handlers[mutation.attributeName] || elementHandler.handlers[mutation.attributeName.toLowerCase()];
    if (!attributeHandler) {
        return;
    }
    var notified = false;
    if (attributeHandler.setFromAttribute) {
        var newValue = target.getAttribute(mutation.attributeName);
        notified = attributeHandler.setFromAttribute(newValue, mutation.oldValue, target, elementHandler.storage);
    }
    if (!notified) {
        var n = new events.NotificationWrapper(mutation, events.VALUE_MODIFIED, mutation.target);
        elementHandler.notify(n);
    }
}


var ElementHandler = function(elem) {
    if (!elem) {
        return;
    }
    this.element = elem;
    this.handlers = null;
    this.storage = {};
    this.adapters = {};
    mutObserver.observe(elem, { childList: true,  attributes: true, attributeOldValue: true} );

};

ElementHandler.prototype.registerAttributes = function(config) {
    var elem = this.element;

    var isHTML = (elem instanceof HTMLElement);
    var keyPrefix = (isHTML ? "_html" : "_xml");
    var handlerKey = keyPrefix + "handlers",
        protoKey = keyPrefix + "proto";

    var canProto = !!elem.__proto__;

    if(!config._cache) config._cache = {};

    if(!config._cache[handlerKey]){
        // Create handlers and prototype only once per configuration
        var proto;
        if(canProto){
            var F = function () {
            };
            F.prototype = elem.__proto__;
            proto = new F();
        }

        var handlers = {};
        for ( var prop in config) {
            if(prop =="_cache") continue;
            if (config[prop] === undefined) {
                if(proto) delete proto[prop];
            } else {
                if (config[prop].a !== undefined) {
                    var attrName = config[prop].id || prop;
                    var handler = new config[prop].a(attrName, config[prop].params);
                    handlers[isHTML ? attrName.toLowerCase() : attrName] = handler;
                    if(proto) {
                        try {
                            Object.defineProperty(proto, prop, handler.desc);
                        } catch (e) {
                            XML3D.debug.logWarning("Can't configure " + elem.nodeName + "::" + prop);
                        }
                    }

                } else if (config[prop].m !== undefined) {
                    if(proto) proto[prop] = config[prop].m;
                } else if (config[prop].p !== undefined) {
                    if(proto){
                        try {
                            Object.defineProperty(proto, prop, config[prop].p);
                        } catch (e) {
                            XML3D.debug.logWarning("Can't configure " + elem.nodeName + "::" + prop);
                        }
                    }
                }else
                    XML3D.debug.logError("Can't configure " + elem.nodeName + "::" + prop);
            }
        }
        config._cache[handlerKey] = handlers;
        config._cache[protoKey] = proto;
    }
    // Set and initialize handlers for element
    this.handlers = config._cache[handlerKey];
    if(canProto){
        elem.__proto__ = config._cache[protoKey];
        for ( var prop in config) {
            if(prop =="_cache") continue;
            if(config[prop] && config[prop].a !== undefined){
                var attrName = config[prop].id || prop;
                var handler = this.handlers[isHTML ? attrName.toLowerCase() : attrName];
                handler.init && handler.init(elem, this.storage);
                delete elem[prop];
            }
        }
    }
    else{
        for ( var prop in config) {
            if(prop =="_cache") continue;
            if (config[prop] === undefined) {
                delete elem[prop];
            }
            else if (config[prop].a !== undefined){
                var attrName = config[prop].id || prop;
                var handler = this.handlers[isHTML ? attrName.toLowerCase() : attrName];
                handler.init && handler.init(elem, this.storage);
                try {
                    Object.defineProperty(elem, prop, handler.desc);
                } catch (e) {
                    XML3D.debug.logWarning("Can't configure " + elem.nodeName + "::" + prop);
                }
            }else if (config[prop].m !== undefined) {
                elem[prop] = config[prop].m;
            } else if (config[prop].p !== undefined) {
                try {
                    Object.defineProperty(elem, prop, config[prop].p);
                } catch (e) {
                    XML3D.debug.logWarning("Can't configure " + elem.nodeName + "::" + prop);
                }
            }
        }
    }

    return elem;
};


ElementHandler.prototype.registerMixed = function() {
    mutObserver.observe(this.element, { childList: true,  attributes: true, attributeOldValue: true, characterData: true, subtree: true} );
};

/**
 * @param evt
 */
ElementHandler.prototype.notify =  function(evt) {
    var adapters = this.adapters;
    for(var a in adapters) {
        try {
            adapters[a].notifyChanged(evt);
        } catch (e) {
            XML3D.debug.logException(e);
        }
    }
};

/*
 * Get called, if the related node gets removed from the DOM
 */
ElementHandler.prototype.remove = function(evt) {
    for(var h in this.adapters) {
        var adapter = this.adapters[h];
        if(adapter.onDispose)
            adapter.onDispose();
        if(adapter.clearAdapterHandles)
            adapter.clearAdapterHandles();
    }
    this.adapters = {};
    for(var h in this.handlers) {
        var handler = this.handlers[h];
        if(handler.remove)
            handler.remove();
    }

};

ElementHandler.prototype.toString = function() {
    return "ElementHandler ("+this.element.nodeName + ", id: "+this.element.id+")";
};

var delegateProperties = ["clientHeight", "clientLeft", "clientTop", "clientWidth",
    "offsetHeight", "offsetLeft", "offsetTop", "offsetWidth"];
function delegateProp(name, elem, canvas) {
    var desc = {
        get : function() {
            return canvas[name];
        }
    };
    try {
        Object.defineProperty(elem, name, desc);
    } catch (e){
        XML3D.debug.logWarning("Can't configure " + elem.nodeName + "::" + name);
    }
}

var XML3DHandler = function(elem) {
    ElementHandler.call(this, elem);
    var c = document.createElement("canvas");
    c.width = 800;
    c.height = 600;
    this.canvas = c;

    for(var i in delegateProperties) {
        delegateProp(delegateProperties[i], elem, c);
    }

    elem.getBoundingClientRect = function() {
        return c.getBoundingClientRect();
    };
};

XML3D.createClass(XML3DHandler, ElementHandler);


var config = {};

/**
 * @param {Element} element
 * @return {undefined}
 */
config.element = function(element) {
    if (element._configured === undefined ) {
        var classInfo = ClassInfo[element.localName];
        if (classInfo === undefined) {
            XML3D.debug.logInfo("Unrecognised element " + element.localName);
        } else {
            element._configured = element.localName == "xml3d" ?
                new XML3DHandler(element)
                : new ElementHandler(element);
            element._configured.registerAttributes(classInfo);
            // Fix difference in Firefox (undefined) and Chrome (null)
            try{
                if (element.style == undefined)
                    element.style = null;
            }
            catch(e){
                // Firefox throws exception here...
            }

            var n = element.firstElementChild;

            XML3D.base.resourceManager.notifyNodeIdChange(element, null, element.getAttribute("id"));

            while(n) {
                config.element(n);
                n = n.nextElementSibling;
            }
        }
    }
};

/**
 * @param {Element} element
 * @return {undefined}
 */
config.configure = function(element) {
    if (Array.isArray(element)) {
        Array.forEach(element, function(el) {
            config.element(el);
        });
    } else {
        config.element(element);
    }
};

window.XML3D.config = config;


module.exports = {
    ElementHandler : ElementHandler,
    XML3DHandler : XML3DHandler,
    config : config
};
