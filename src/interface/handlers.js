new (function() {

    handler = {};

    handler.delegateStringAttribute = function(elem, id) {
        this.desc = {
            get : function() {
                return this.getAttribute(id) || "";
            },
            set : function(value) {
                this.setAttribute(id, value);
            }
        };
    };

    handler.delegateEnum = function(elem, id, p) {
        var current = p.d;
        this.desc = {
            get : function() {
                return p.e[current];
            },
            set : function(v) {
                // Attribute is always set to value
            this.setAttribute(id, v);
            var value = typeof v == 'string' ? v.toLowerCase() : undefined;
            if (value && p.e[value] !== undefined)
                current = p.e[value];
            else
                current = p.d;
        }
        };
    };

    handler.delegateEventAttribute = function(elem, id) {
        var f = null;
        var e = elem;
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
            set : function(value) {
                if (typeof value == 'function') {
                    f = value;
                }
            }
        };
    };

    handler.delegateIntAttribute = function(elem, id, defaultValue) {
        var current = defaultValue;

        this.desc = {
            get : function() {
                return current;
            },
            set : function(value) {
                var v = +value;
                current = typeof v == 'number' ? Math.floor(v) : defaultValue;
                this.setAttribute(id, current + '');
            }
        };
    };

    handler.delegateBoolAttribute = function(elem, id, defaultValue) {
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

    handler.syncVec3 = function(elem, id, d) {
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

    handler.syncRotation = function(elem, id, d) {
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

    handler.delegateFloatAttribute = function(elem, id, defaultValue) {
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
                };
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


    handler.syncFloatArray = function(elem, id) {
        var ta = null;
        this.desc = typedDesc(elem, ta, this);
    };
    
    handler.syncFloatArray.prototype.parse = function(elem) {
        var exp = /([+\-0-9eE\.]+)/g;
        var str = getContent(elem);
        var m = str.match(exp);
        return m ? new Float32Array(m) : new Float32Array();
    };

    handler.syncFloat2Array = handler.syncFloatArray;
    handler.syncFloat3Array = handler.syncFloatArray;
    handler.syncFloat4Array = handler.syncFloatArray;
    handler.syncFloat4x4Array = handler.syncFloatArray;

    handler.syncIntArray = function(elem, id) {
        var ta = null;
        this.desc = typedDesc(elem, ta, this);
    };
    handler.syncIntArray.prototype.parse = function(elem) {
        var exp = /([+\-0-9]+)/g;
        var str = getContent(elem);
        var m = str.match(exp);
        return m ? new Int32Array(m) : new Int32Array();
    };
    
    handler.syncBoolArray = function(elem, id) {
        var ta = null;
        this.desc = typedDesc(elem, ta, this);
    };
    handler.syncBoolArray.prototype.parse = function(elem) {
        var exp = /(true|false|0|1)/ig;
        var str = getContent(elem);
        var m = str.match(exp);
        if(!m)
            return new Uint8Array();
        m = Array.map(m,function(string){
            switch(string.toLowerCase()){
            case "true": case "1": return true;
            case "false": case "0": return false;
            default: return Boolean(string);
            }
        });
        console.log(m);
        return m ? new Uint8Array(m) : new Uint8Array();
    };

    // Export to org.xml3d namespace
    org.xml3d.extend(org.xml3d, handler);

});
