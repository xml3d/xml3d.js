(function() {

    var handler = {};

    handler.ElementHandler = function(elem) {
        if (elem) {
            this.element = elem;
            this.element.addEventListener('DOMAttrModified', this, false);
            this.handlers = {};
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

    handler.ElementHandler.prototype.handleEvent = function(e) {
        var handler = this.handlers[e.attrName];
        if (handler && handler.setFromAttribute)
            handler.setFromAttribute(e.newValue);
        console.log(e);
    };

    // Export to org.xml3d namespace
    org.xml3d.extend(org.xml3d, handler);

}());
