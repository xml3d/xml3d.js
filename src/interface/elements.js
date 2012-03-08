
(function() {

    var handler = {}, events = xml3d.events;

    function attrModified(e) {
        var eh = e.relatedNode._configured;
        var handler = eh && eh.handlers[e.attrName];
        if(!handler)
            return;

        var notified = false;
        if (handler.setFromAttribute) {
            notified = handler.setFromAttribute(e.newValue);
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
                removedChild._configured.notify(n);
                removedChild._configured.remove(n);
            }
        }
    }

    function nodeInserted(e) {
        var parent = e.relatedNode,
            insertedChild = e.target,
            parentHandler = parent._configured;

        if(!parentHandler || e.currentTarget === insertedChild)
            return;

        var n = new events.NotificationWrapper(e)

        if (insertedChild.nodeType == Node.TEXT_NODE && parentHandler.handlers.value) {
            n.type = events.VALUE_MODIFIED;
            parentHandler.handlers.value.resetValue();
        } else {
            xml3d.configure(insertedChild);
            n.type = events.NODE_INSERTED;
        }
        parentHandler.notify(n);
    }

    handler.ElementHandler = function(elem, monitor) {
        if (elem) {
            this.element = elem;
            this.handlers = {};
            this.adapters = {};

            if(monitor) {
                elem.addEventListener('DOMNodeRemoved', nodeRemoved, true);
                elem.addEventListener('DOMNodeInserted', nodeInserted, true);
                elem.addEventListener('DOMAttrModified', attrModified, false);
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
                    Object.defineProperty(a, prop, v.desc);
                } else if (b[prop].m !== undefined) {
                    a[prop] = b[prop].m;
                } else
                    xml3d.debug.logError("Can't configure " + a.nodeName + "::" + prop);
            }
        }
        return a;
    };

    handler.ElementHandler.prototype.registerMixed = function() {
        this.element.addEventListener('DOMCharacterDataModified', this, false);
    };

    handler.ElementHandler.prototype.handleEvent = function(e) {

        xml3d.debug.logDebug(e.type + " at " + e.currentTarget.localName + "/" + e.target);
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
                xml3d.debug.logError(e);
            }
        }
    };

    handler.ElementHandler.prototype.addOpposite =  function(evt) {
        (this.opposites || (this.opposites = [])).push(evt);
    };

    handler.ElementHandler.prototype.notifyOpposite = function(evt) {
        if(evt.value && evt.value._configured) {
            evt.value._configured.addOpposite(evt);
        }
    };

    handler.ElementHandler.prototype.remove = function(evt) {
        //console.log("Remove " + this);
        if (this.opposites) {
            for(var o in this.opposites) {
                var oi = this.opposites[o];
                if(oi.relatedNode._configured) {
                    var r = new events.ReferenceNotification(oi.relatedNode, oi.attrName);
                    oi.relatedNode._configured.notify(r);
                }
            }
        }
    };

    handler.ElementHandler.prototype.resolve = function(attrName) {
        var uri = new xml3d.URI(this.element[attrName]);
        if (uri.valid && uri.fragment) {
            return xml3d.URIResolver.resolve(uri);
        }
        return null;
    };

    handler.ElementHandler.prototype.toString = function() {
        return "ElementHandler ("+this.element.nodeName + ", id: "+this.element.id+")";
    };

    handler.XML3DHandler = function(elem) {
        handler.ElementHandler.call(this, elem, true);
        var c = document.createElement("canvas");
        c.width = 800;
        c.height = 600;
        this.canvas = c;
        Object.defineProperty(elem, "clientWidth", {
            get : function() {
                return c.clientWidth;
            }
        });
        Object.defineProperty(elem, "clientHeight", {
            get : function() {
                return c.clientHeight;
            }
        });
    };

    xml3d.createClass(handler.XML3DHandler, handler.ElementHandler);

    /*
     * handler.XML3DHandler.prototype.registerAttributes = function(config) {
     * console.dir(handler.XML3DHandler);
     * handler.XML3DHandler.superclass.registerAttributes.call(this, config);
     * Object.defineProperty(this.element, "style", this.styler); };
     */

    // Export to xml3d namespace
    xml3d.extend(xml3d, handler);

}());
