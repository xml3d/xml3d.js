xml3d.events = {
        VALUE_MODIFIED:  99
};


(function() {

    var handler = {};

    handler.ElementHandler = function(elem) {
        if (elem) {
            this.element = elem;
            elem.addEventListener('DOMAttrModified', this, false);
            elem.addEventListener('DOMNodeRemoved', this, true);
            elem.addEventListener('DOMNodeInserted', this, true);
            this.handlers = {};
            this.adapters = {};
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
                    console.error("Can't configure " + a.nodeName + "::" + prop);
            }
        }
        return a;
    };

    handler.ElementHandler.prototype.registerMixed = function() {
        this.element.addEventListener('DOMCharacterDataModified', this, false);
    };

    handler.ElementHandler.prototype.handleEvent = function(e) {
        //if(this.element != e.relatedNode)
        //    return;
        console.log(e.type + " at " + e.currentTarget.localName);

        switch (e.type) {
        case "DOMAttrModified":
            var handler = this.handlers[e.attrName];
            var notified = false;
            if (handler && handler.setFromAttribute) {
                notified = handler.setFromAttribute(e.newValue);
                if (!notified) {
                    this.notify(e);
                }
            }
            break;
        case "DOMNodeInserted":
            if (e.target.nodeType == Node.TEXT_NODE && this.handlers.value) {
                e.eventType = xml3d.events.VALUE_MODIFIED;
                this.handlers.value.resetValue();
            } else {
                e.eventType = MutationEvent.ADDITION;
            }
            this.notify(e);
            break;
        case "DOMNodeRemoved":
            e.eventType = MutationEvent.REMOVAL;
            this.notify(e);
            if(e.target._configured)
                e.target._configured.remove(e);
            break;
        case "DOMCharacterDataModified":
            e.eventType = xml3d.events.VALUE_MODIFIED;
            this.handlers.value.resetValue();
            this.notify(e);
            break;
        };
    };

    handler.ElementHandler.prototype.notify = function(evt) {
        var adapters = this.adapters;
        for(var a in adapters) {
            try {
                adapters[a].notifyChanged(evt);
            } catch (e) {
                xml3d.debug.logError(e);
            }
        }
    };

    handler.ElementHandler.prototype.remove = function(evt) {
        // TODO
    };

    handler.ElementHandler.prototype.resolve = function(attrName) {
        var uri = new xml3d.URI(this.element[attrName]);
        if (uri.valid && uri.fragment) {
            return xml3d.URIResolver.resolve(uri);
        }
        return null;
    };

    handler.XML3DHandler = function(elem) {
        handler.ElementHandler.call(this, elem);
        var c = document.createElement("canvas");
        c.width = 800;
        c.height = 600;
        this.canvas = c;
        Object.defineProperty(elem, "clientWidth", {
            get : function() {
                console.log("clientWidth");
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
