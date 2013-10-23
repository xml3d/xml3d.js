
(function() {

    var handler = {}, events = XML3D.events;

    function attrModified(e) {

        var eh = e.target._configured;

        if(e.attrName == "style"){
            var n = new events.NotificationWrapper(e);
            n.type = events.VALUE_MODIFIED;
            eh.notify(n);
            return;
        }

        var handler = eh && eh.handlers[e.attrName];
        if(!handler)
            return;

        var notified = false;
        if (handler.setFromAttribute) {
            notified = handler.setFromAttribute(e.newValue, e.prevValue);
        }
        if (!notified) {
            var n = new events.NotificationWrapper(e);
            n.type = events.VALUE_MODIFIED;
            eh.notify(n);
        }
    };

    function nodeRemoved(e) {
        var parent = e.relatedNode,
        removedChild = e.target,
        parentHandler = parent._configured;

        if(!parentHandler)
            return;

        var n = new events.NotificationWrapper(e);

        if (removedChild.nodeType == Node.TEXT_NODE && parentHandler.handlers.value) {
            n.type = events.VALUE_MODIFIED;
            parentHandler.handlers.value.resetValue();
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
        e.stopPropagation();
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
            parentHandler.handlers.value.resetValue();
        } else {
            XML3D.config.element(insertedChild);
            n.type = events.NODE_INSERTED;
            addRecursive(insertedChild);
        }
        parentHandler.notify(n);
        // TODO: Quick fix, solve issue of self monitoring elements better
        e.stopPropagation();
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

    function nodeInsertedIntoDocument(e){
        var node = e.target;
        XML3D.base.resourceManager.notifyNodeIdChange(node, null, node.id);
    }

    function nodeRemovedFromDocument(e){
        var node = e.target;
        XML3D.base.resourceManager.notifyNodeIdChange(node, node.id, null);
    }

    handler.ElementHandler = function(elem, monitor) {
        if (elem) {
            this.element = elem;
            this.handlers = {};
            this.adapters = {};

            if(monitor) {
                elem.addEventListener('DOMNodeRemoved', nodeRemoved, true);
                elem.addEventListener('DOMNodeInserted', nodeInserted, true);
                elem.addEventListener('DOMNodeInsertedIntoDocument', nodeInsertedIntoDocument, true);
                elem.addEventListener('DOMNodeRemovedFromDocument', nodeRemovedFromDocument, true);
                elem.addEventListener('DOMAttrModified', attrModified, true);
                this.monitoring = true;
            }
        }
    };

    handler.ElementHandler.prototype.registerAttributes = function(b) {
        var a = this.element;
        for ( var prop in b) {
            if (b[prop] === undefined) {
                delete a[prop];
            } else {
                if (b[prop].a !== undefined) {
                    var attrName = b[prop].id || prop;
                    var v = new b[prop].a(a, attrName, b[prop].params);
                    this.handlers[attrName] = v;
                    try {
                        Object.defineProperty(a, prop, v.desc);
                    } catch (e) {
                        XML3D.debug.logWarning("Can't configure " + a.nodeName + "::" + prop);
                    }
                } else if (b[prop].m !== undefined) {
                    a[prop] = b[prop].m;
                } else
                    XML3D.debug.logError("Can't configure " + a.nodeName + "::" + prop);
            }
        }
        return a;
    };


    handler.ElementHandler.prototype.registerMixed = function() {
        this.element.addEventListener('DOMCharacterDataModified', this, false);
    };

    handler.ElementHandler.prototype.handleEvent = function(e) {

        XML3D.debug.logDebug(e.type + " at " + e.currentTarget.localName + "/" + e.target);
        var n = new events.NotificationWrapper(e);

        switch (e.type) {
            case "DOMCharacterDataModified":
                n.type = events.VALUE_MODIFIED;
                this.handlers.value.resetValue();
                this.notify(n);
                break;
        };
    };


    /**
     * @param evt
     */
    handler.ElementHandler.prototype.notify =  function(evt) {
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
    handler.ElementHandler.prototype.remove = function(evt) {
        //console.log("Remove " + this);
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

    handler.ElementHandler.prototype.toString = function() {
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
        };
    }

    handler.XML3DHandler = function(elem) {
        handler.ElementHandler.call(this, elem, true);
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

    XML3D.createClass(handler.XML3DHandler, handler.ElementHandler);

    // Export to xml3d namespace
    XML3D.extend(XML3D, handler);

}());
