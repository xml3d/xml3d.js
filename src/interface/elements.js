var events = require("./notification.js");
var ClassInfo = require("./configuration.js").classInfo;

var MutationObserver = (window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver),
    mutObserver;

if(MutationObserver){
    mutObserver = new MutationObserver(handleMutations);
}

XML3D.flushDOMChanges = function(){
    if(mutObserver){
        var records = mutObserver.takeRecords();
        handleMutations(records);
    }
};

function handleMutations(mutations){
    for(var i = 0; i < mutations.length; ++i){
        var mutation = mutations[i];
        var target = mutation.target;
        if(mutation.type == 'attributes'){
            var newValue = target.getAttribute(mutation.attributeName);
            if(newValue === null) newValue = "";
            attrModified({
                target: target,
                attrName: mutation.attributeName,
                newValue: newValue,
                prevValue: mutation.oldValue,
                relatedNode: target});
        }
        else if(mutation.type == 'childList'){
            var addedNodes = mutation.addedNodes;
            var j = addedNodes.length;
            while(j--){
                nodeInserted({
                    target: addedNodes[j],
                    relatedNode: target,
                    currentTarget: target
                });
            }
            var removedNodes = mutation.removedNodes;
            var j = removedNodes.length;
            while(j--){
                nodeRemoved({
                    target: removedNodes[j],
                    relatedNode: target,
                    currentTarget: target
                });
            }
        }
        else if(mutation.type == 'characterData'){
            characterDataChanged({ target: target});
        }
    }
}

function attrModified(e) {
    var eh = e.target._configured;

    if(e.attrName == "style"){
        var n = new events.NotificationWrapper(e);
        n.type = events.VALUE_MODIFIED;
        eh.notify(n);
    }

    var isHTML = e.target instanceof HTMLElement;
    var handler = eh && eh.handlers[isHTML ? e.attrName.toLowerCase() : e.attrName];
    if(!handler)
        return;

    var notified = false;
    if (handler.setFromAttribute) {
        notified = handler.setFromAttribute(e.newValue, e.prevValue, e.target, eh.storage);
    }
    if (!notified) {
        var n = new events.NotificationWrapper(e);
        n.type = events.VALUE_MODIFIED;
        eh.notify(n);
    }
}

function nodeRemoved(e) {
    var parent = e.relatedNode,
    removedChild = e.target,
    parentHandler = parent._configured;

    if(!parentHandler)
        return;

    var n = new events.NotificationWrapper(e);

    if (removedChild.nodeType == Node.TEXT_NODE && parentHandler.handlers.value) {
        n.type = events.VALUE_MODIFIED;
        parentHandler.handlers.value.resetValue(parentHandler.storage);
    } else {
        n.type = events.NODE_REMOVED;
        parentHandler.notify(n);
        if(removedChild._configured) {
            n.type = events.THIS_REMOVED;
            removeRecursive(removedChild,n);
            notifyNodeIdChangeRecursive(removedChild);
        }
    }
    // TODO: Quick fix, solve issue of self monitoring elements better
    //Quick fix for ghost element bug

    // Dynamically generated objects are self-monitoring, means listening for their own changes.
    // Once added to the scene, they should stop, otherwise multiple events are received that lead
    // i.e. to multiple draw objects per mesh.
    // Now the first event handler stops propagation of the event, but this can have strange side-FX,
    // if i.e. nodes are monitored from outside.
    e.stopPropagation && e.stopPropagation();
}

function removeRecursive(element, evt) {
    if(element._configured) {
        element._configured.notify(evt);
        element._configured.remove(evt);
    }
    var n = element.firstElementChild;
    while(n) {
        removeRecursive(n,evt);
        n = n.nextElementSibling;
    }
}

function notifyNodeIdChangeRecursive(element){
    // We call this here in addition to nodeRemovedFromDocument, since the later is not supported by Firefox
    // TODO: Remove this function call once DOMNodeRemoveFromDocument is supported by all major browsers
    XML3D.base.resourceManager.notifyNodeIdChange(element, element.id, null);

    var n = element.firstElementChild;
    while(n) {
        notifyNodeIdChangeRecursive(n);
        n = n.nextElementSibling;
    }
}


function nodeInserted(e) {
    var parent = e.relatedNode,
    insertedChild = e.target,
    parentHandler = parent._configured;

    if(!parentHandler || e.currentTarget === insertedChild)
        return;

    var n = new events.NotificationWrapper(e);

    if (insertedChild.nodeType == Node.TEXT_NODE && parentHandler.handlers.value) {
        n.type = events.VALUE_MODIFIED;
        parentHandler.handlers.value.resetValue(parentHandler.storage);
    } else {
        config.element(insertedChild);
        n.type = events.NODE_INSERTED;
        addRecursive(insertedChild);
    }
    parentHandler.notify(n);
    // TODO: Quick fix, solve issue of self monitoring elements better
    e.stopPropagation && e.stopPropagation();
}

// TODO: Remove this function once DOMNodeInsertedIntoDocument is supported by all major browsers
function addRecursive(element){
    var n = element.firstElementChild;
    while(n) {
        addRecursive(n);
        n = n.nextElementSibling;
    }
    // We call this here in addition to nodeInsertedIntoDocument, since the later is not supported by Firefox

    XML3D.base.resourceManager.notifyNodeIdChange(element, null, element.id);
}

function characterDataChanged(e){
    var target = e.target;
    while(!target._configured && target.parentElement)
        target = target.parentElement;
    var eh = target._configured;
    if(!eh) return;
    var n = new events.NotificationWrapper(e);
    n.type = events.VALUE_MODIFIED;
    eh.handlers.value.resetValue(eh.storage);
    eh.notify(n);
}

var ElementHandler = function(elem, monitor) {
    if (elem) {
        this.element = elem;
        this.handlers = null;
        this.storage = {};
        this.adapters = {};

        if(mutObserver){
            mutObserver.observe(elem, { childList: true,  attributes: true, attributeOldValue: true} );
        }
        else{
            if(monitor) {
                elem.addEventListener('DOMNodeRemoved', nodeRemoved, true);
                elem.addEventListener('DOMNodeInserted', nodeInserted, true);
                //elem.addEventListener('DOMNodeInsertedIntoDocument', nodeInsertedIntoDocument, true);
                //elem.addEventListener('DOMNodeRemovedFromDocument', nodeRemovedFromDocument, true);
                elem.addEventListener('DOMAttrModified', attrModified, true);
                this.monitoring = true;
            }
        }


    }
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
    if(mutObserver){
        mutObserver.observe(this.element, { childList: true,  attributes: true, attributeOldValue: true, characterData: true, subtree: true} );
    }
    else{
        this.element.addEventListener('DOMCharacterDataModified', characterDataChanged, false);
    }
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
    ElementHandler.call(this, elem, true);
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
 * @param {boolean=} selfmonitoring: whether to register listeners on element for node
 *                  addition/removal and attribute modification. This property is propagated
 *                  to children.
 * @return {undefined}
 */
config.element = function(element, selfmonitoring) {
    if (element._configured === undefined ) {
        var classInfo = ClassInfo[element.localName];
        if (classInfo === undefined) {
            XML3D.debug.logInfo("Unrecognised element " + element.localName);
        } else {
            element._configured = element.localName == "xml3d" ?
                new XML3DHandler(element)
                : new ElementHandler(element,selfmonitoring);
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
                config.element(n, selfmonitoring);
                n = n.nextElementSibling;
            }
        }
    }
};

/**
 * @param {Element} element
 * @param {boolean=} selfmonitoring: whether to register listeners on element for node
 *                  addition/removal and attribute modification. This property is propagated
 *                  to children.
 * @return {undefined}
 */
config.configure = function(element, selfmonitoring) {
    if (Array.isArray(element)) {
        Array.forEach(element, function(el) {
            config.element(el, selfmonitoring);
        });
    } else {
        config.element(element, selfmonitoring);
    }
};


module.exports = {
    ElementHandler : ElementHandler,
    XML3DHandler : XML3DHandler,
    config : config
};
