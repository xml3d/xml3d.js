new (function() {

    handler = {};

    handler.ElementHandler = function(elem) {
        if (elem) {
            this.element = elem;
            this.element.addEventListener('DOMAttrModified', this, false);
            this.handlers = {};
        }
    };

    handler.ElementHandler.prototype.registerAttributes = function (b) {
        var a = this.element;
        for ( var prop in b ) {
            if ( b[prop] === undefined ) {
                delete a[prop];
            } else {
                if (b[prop].c == undefined)
                    throw ("Can't configure " + a.nodeName + "::" + prop);
                var attrName = b[prop].id || prop;
                var v = new b[prop].c(a, attrName, b[prop].params);
                this.handlers[attrName] = v;
                Object.defineProperty(a, prop, v.desc);
            }
        }
        return a;
    };

    handler.ElementHandler.prototype.handleEvent = function(e) {
        var handler = this.handlers[e.attrName];
        if(handler && handler.setter)
            handler.setter(e.newValue, true);
        console.log(e);
    };

    AttributeHandler = function(elem) {
        this.setter = function(e) {
            console.log("AttributeHandler:: " + e);
        };
    };

    handler.StringAttributeHandler = function(elem, id) {
        this.desc = {
            get : function() {
                return this.getAttribute(id) || "";
            },
            set : function(value) {
                this.setAttribute(id, value);
            }
        };
    };

    handler.EnumAttributeHandler = function(elem, id, p) {
        AttributeHandler.call(this, elem);
        var current = p.d;

        this.setter = function(v, fromAttribute) {
            if(!fromAttribute) {
                // Attribute is always set to value
                 this.setAttribute(id, v);
             }
             var value = typeof v == 'string' ? v.toLowerCase() : undefined;
             if (value && p.e[value] !== undefined)
                 current = p.e[value];
             else
                 current = p.d;
         };

         this.desc = {
            get : function() {
                return p.e[current];
            },
            set : this.set
        };
    };
    handler.EnumAttributeHandler.prototype = new AttributeHandler();
    handler.EnumAttributeHandler.prototype.constructor = handler.EnumAttributeHandler;

    handler.EventAttributeHandler = function(elem, id) {
        AttributeHandler.call(this, elem);
        var f = null;
        var e = elem;
        this.setter = function(value, fromAttribute) {
            if (typeof value == 'function') {
                f = value;
            }
            if (fromAttribute)
                f = null;
        };
        this.desc = {
            get : function() {
                if (f) {
                    return f;
                }
                ;
                if (!this.hasAttribute(id))
                    return null;
                return eval("c = function onclick(event){\n  " + this.getAttribute(id) + "\n}");
            },
            set : this.setter
        };
    };
    handler.EventAttributeHandler.prototype = new AttributeHandler();
    handler.EventAttributeHandler.prototype.constructor = handler.EventAttributeHandler;

    handler.IntAttributeHandler = function(elem, id, defaultValue) {
        var current = defaultValue;
        this.setter = function(value, fromAttribute) {
            var v = +value;
            current = typeof v == 'number' ? Math.floor(v) : defaultValue;
            if(!fromAttribute)
                this.setAttribute(id, current + '');
        };
        this.desc = {
            get : function() {
                return current;
            },
            set : this.setter
        };
    };
    handler.IntAttributeHandler.prototype = new AttributeHandler();
    handler.IntAttributeHandler.prototype.constructor = handler.IntAttributeHandler;

    handler.BoolAttributeHandler = function(elem, id, defaultValue) {
        var current = defaultValue;

        this.desc = {
            get : function() {
                return current;
            },
            set : function(value) {
                current = Boolean(value);
                this.setAttribute(id, current + '');
            }
        };
    };

    handler.XML3DVec3AttributeHandler = function(elem, id, d) {
        var v = null;
        var changed = function(value) {
            elem.setAttribute(id, value.x + " " + value.y + " " + value.z);
        };
        this.desc = {
            get : function() {
                if (!v) {
                    v = new XML3DVec3(d[0], d[1], d[2], changed);
                }
                return v;
            },
            set : function(value) {
                throw Error("Can't set " + elem.nodeName + "::" + id + ": it's readonly");
            }
        };
    };

    handler.XML3DRotationAttributeHandler = function(elem, id, d) {
        var v = null;
        var changed = function(v) {
            elem.setAttribute(id, v.axis.x + " " + v.axis.y + " " + v.axis.z + " " + v.angle);
        };
        this.desc = {
            get : function() {
                if (!v) {
                    v = new XML3DRotation(new XML3DVec3(d[0], d[1], d[2]), d[3], changed);
                }
                return v;
            },
            set : function(value) {
                throw Error("Can't set " + elem.nodeName + "::" + id + ": it's readonly");
            }
        };
    };

    handler.FloatAttributeHandler = function(elem, id, defaultValue) {
        var current = defaultValue;

        this.desc = {
            get : function() {
                return current;
            },
            set : function(value) {
                var v = +value;
                current = typeof v == 'number' ? v : defaultValue;
                this.setAttribute(id, current + '');
            }
        };
    };

    var typedDesc = function(elem, ta, handler) {
        return {
            get : function() {
                if (!ta) {
                    ta = handler.parse(elem);
                }
                ;
                return ta;
            },
            set : function(value) {
                // Throw error?
            throw Error("Can't set " + elem.nodeName + "::value: it's readonly");
        }
        };
    };

    var getContent = function(elem) {
        var str = "";
        var k = elem.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }
        return str;
    };

    handler.FloatArrayValueHandler = function(elem, id) {
        var ta = null;
        this.desc = typedDesc(elem, ta, this);
    };

    handler.FloatArrayValueHandler.prototype.parse = function(elem) {
        var exp = /([+\-0-9eE\.]+)/g;
        var str = getContent(elem);
        var m = str.match(exp);
        return m ? new Float32Array(m) : new Float32Array();
    };

    handler.Float2ArrayValueHandler = handler.FloatArrayValueHandler;
    handler.Float3ArrayValueHandler = handler.FloatArrayValueHandler;
    handler.Float4ArrayValueHandler = handler.FloatArrayValueHandler;
    handler.Float4x4ArrayValueHandler = handler.FloatArrayValueHandler;

    handler.IntArrayValueHandler = function(elem, id) {
        var ta = null;
        this.desc = typedDesc(elem, ta, this);
    };
    handler.IntArrayValueHandler.prototype.parse = function(elem) {
        var exp = /([+\-0-9]+)/g;
        var str = getContent(elem);
        var m = str.match(exp);
        return m ? new Int32Array(m) : new Int32Array();
    };

    handler.BoolArrayValueHandler = function(elem, id) {
        var ta = null;
        this.desc = typedDesc(elem, ta, this);
    };
    handler.BoolArrayValueHandler.prototype.parse = function(elem) {
        var exp = /(true|false|0|1)/ig;
        var str = getContent(elem);
        var m = str.match(exp);
        if (!m)
            return new Uint8Array();
        m = Array.map(m, function(string) {
            switch (string.toLowerCase()) {
            case "true":
            case "1":
                return true;
            case "false":
            case "0":
                return false;
            default:
                return Boolean(string);
            }
        });
        return m ? new Uint8Array(m) : new Uint8Array();
    };

    // Export to org.xml3d namespace
    org.xml3d.extend(org.xml3d, handler);

});
