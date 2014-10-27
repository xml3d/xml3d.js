(function() {

    var string2bool = function(string) {
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
    }, handler = {}, events = XML3D.events;

    function getStorage(elem){
        return elem._configured.storage;
    }

    var AttributeHandler = function(elem) {
    };

    handler.IDHandler = function(id) {
        this.setFromAttribute = function(value, prevValue, elem) {
            XML3D.base.resourceManager.notifyNodeIdChange(elem, prevValue, value);
        }
        this.desc = {
            get : function() {
                return this.getAttribute(id) || "";
            },
            set : function(value) {
                this.setAttribute(id, value);
            }
        };
    };

    handler.StringAttributeHandler = function(id) {
        this.desc = {
            get : function() {
                return this.getAttribute(id) || "";
            },
            set : function(value) {
                this.setAttribute(id, value);
            }
        };
    };

    // TODO: remove reference handler in webgl generator and remove this line
    handler.ReferenceHandler = handler.StringAttributeHandler;


    handler.EnumAttributeHandler = function(id, p) {
        AttributeHandler.call(this);

        this.init = function(elem, storage){
            storage[id] = p.d;
            if (elem.hasAttribute(id))
                this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
        };
        this.setFromAttribute = function(v, prevValue, elem, storage) {
            var value = v.toLowerCase();
            storage[id] = (value && p.e[value] !== undefined) ? p.e[value] : p.d;
            return false;
        };
        this.desc = {
            get : function() {
                var storage = getStorage(this);
                return p.e[storage[id]];
            },
            set : function(v) {
                    // Attribute is set to whatever comes in
                this.setAttribute(id, v);
                var storage = getStorage(this);
                var value = typeof v == 'string' ? v.toLowerCase() : undefined;
                if (value && p.e[value] !== undefined)
                    storage[id] = p.e[value];
                else
                    storage[id] = p.d;
            }
        };
    };
    handler.EnumAttributeHandler.prototype = new AttributeHandler();
    handler.EnumAttributeHandler.prototype.constructor = handler.EnumAttributeHandler;

    handler.EventAttributeHandler = function(id) {
        AttributeHandler.call(this);

        this.init = function(elem, storage){
            storage[id] = null;
        }

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            storage[id] = null;
            return false;
        };
        this.desc = {
            get : function() {
                var storage = getStorage(this);
                if (storage[id])
                    return storage[id];
                if (!this.hasAttribute(id) || storage[id] === undefined)
                    return null;
                return eval("crx = function onclick(event){\n  " + this.getAttribute(id) + "\n}");
            },
            set : function(value) {
                var storage = getStorage(this);
                storage[id] = (typeof value == 'function') ? value : undefined;
                this._configured.notify( {
                    attrName : id,
                    relatedNode : this
                });
            }
        };
    };
    handler.EventAttributeHandler.prototype = new AttributeHandler();
    handler.EventAttributeHandler.prototype.constructor = handler.EventAttributeHandler;

    handler.IntAttributeHandler = function(id, defaultValue) {

        this.init = function(elem, storage){
            storage[id] = defaultValue;
            if (elem.hasAttribute(id))
                this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
        }

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            var v = value.match(/^\d+/);
            storage[id] = v ? +v[0] : defaultValue;
            if(elem._configured.canvas)
                elem._configured.canvas[id] = storage[id];
            return false;
        };

        this.desc = {
            get : function(){
                var storage = getStorage(this);
                return storage[id];
            },
            set : function(value) {
                var storage = getStorage(this);
                var v = +value;
                storage[id] = isNaN(v) ? defaultValue : Math.floor(v);
                this.setAttribute(id, storage[id] + '');
            }
        };
    };
    handler.IntAttributeHandler.prototype = new AttributeHandler();
    handler.IntAttributeHandler.prototype.constructor = handler.IntAttributeHandler;

    handler.FloatAttributeHandler = function(id, defaultValue) {

        this.init = function(elem, storage){
            storage[id] = defaultValue;
            if (elem.hasAttribute(id))
                this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
        }

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            var v = +value;
            storage[id] = isNaN(v) ? defaultValue : v;
            return false;
        };

        this.desc = {
            get : function() {
                var storage = getStorage(this);
                return storage[id];
            },
            set : function(value) {
                var storage = getStorage(this);
                var v = +value;
                storage[id] = isNaN(v) ? defaultValue : v;
                this.setAttribute(id, storage[id] + '');
            }
        };
    };

    handler.BoolAttributeHandler = function(id, defaultValue) {
        this.init = function(elem, storage){
            storage[id] = defaultValue;
            if (elem.hasAttribute(id))
                this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
        }
        this.setFromAttribute = function(value, prevValue, elem, storage) {
            storage[id] = string2bool(value + '');
            return false;
        };

        this.desc = {
            get : function() {
                var storage = getStorage(this);
                return storage[id];
            },
            set : function(value) {
                var storage = getStorage(this);
                storage[id] = Boolean(value);
                this.setAttribute(id, storage[id] + '');
            }
        };
    };

    handler.XML3DVec3AttributeHandler = function(id, d) {
        var that = this;

        this.init = function(elem, storage){
            storage[id] = null;
        }

        this.initVec3 = function(elem, storage, x, y, z){
            var changed = function(value) {
                elem.setAttribute(id, value.x + " " + value.y + " " + value.z);
            };
            storage[id] = new window.XML3DVec3(x, y, z, changed);
        };

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            if (!storage[id]) {
                this.initVec3(elem, storage, 0, 0, 0);
            }
            var v = storage[id];
            var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(value);
            if (!m) {
                v._data.set(d);
            } else {
                v._data[0] = m[1];
                v._data[1] = m[2];
                v._data[2] = m[3];
            }
            return false;
        };

        this.desc = {
            get : function() {
                var storage = getStorage(this);
                if (!storage[id]) {
                    that.setFromAttribute(this.getAttribute(id), null, this, storage);
                }
                return storage[id];
            },
            set : function(value) {
                throw Error("Can't set " + this.nodeName + "::" + id + ": it's readonly");
            }
        };
    };

    handler.XML3DRotationAttributeHandler = function(id, d) {
        var that = this;

        this.init = function(elem, storage){
            storage[id] = null;
        }

        this.initRotation = function(elem, storage){
            var changed = function(v) {
                elem.setAttribute(id, v.axis.x + " " + v.axis.y + " " + v.axis.z + " " + v.angle);
            };
            storage[id] = new window.XML3DRotation(null, null, changed);
        };

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            if (!storage[id]) {
                this.initRotation(elem, storage);
            }
            var v = storage[id];
            var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(value);
            if (!m) {
                v._axis._data[0] = d[0];
                v._axis._data[1] = d[1];
                v._axis._data[2] = d[2];
                v._angle = d[3];
                v._updateQuaternion();
            } else {
                v._axis._data[0] = +m[1];
                v._axis._data[1] = +m[2];
                v._axis._data[2] = +m[3];
                v._angle = +m[4];
                v._updateQuaternion();
            }
            return false;
        };

        this.desc = {
            get : function() {
                var storage = getStorage(this);
                if (!storage[id]) {
                    that.setFromAttribute(this.getAttribute(id), null, this, storage);
                }
                return storage[id];
            },
            set : function(value) {
                throw Error("Can't set " + this.nodeName + "::" + id + ": it's readonly");
            }
        };
    };

    var mixedContent = function(handler) {
        handler.init = function(elem, storage){
            elem._configured.registerMixed();
        }
        handler.desc = {
            get : function() {
                var storage = getStorage(this);
                if (!storage.value) {
                    storage.value = handler.parse(this);
                }
                return storage.value;
            },
            set : function(value) {
                // Throw error?
                throw Error("Can't set " + this.nodeName + "::value: it's readonly");
            }
        };
        handler.resetValue = function(storage) { storage.value = null; };
    };

    var getContent = function(elem) {
        var str = "";
        var k = elem.firstChild;
        while (k) {
            str += k.nodeType == 3 ? k.textContent : " ";
            k = k.nextSibling;
        }
        return str;
    };

    handler.FloatArrayValueHandler = function(id) {
        mixedContent(this);
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

    handler.IntArrayValueHandler = function(id) {
        mixedContent(this);
    };
    handler.IntArrayValueHandler.prototype.parse = function(elem) {
        var exp = /([+\-0-9]+)/g;
        var str = getContent(elem);
        var m = str.match(exp);
        return m ? new Int32Array(m) : new Int32Array();
    };

    handler.BoolArrayValueHandler = function(id) {
        mixedContent(this);
    };
    handler.BoolArrayValueHandler.prototype.parse = function(elem) {
        var exp = /(true|false|0|1)/ig;
        var str = getContent(elem);
        var m = str.match(exp);
        if (!m)
            return new Uint8Array();
        m = Array.map(m, string2bool);
        return m ? new Uint8Array(m) : new Uint8Array();
    };

    handler.StringValueHandler = function(id) {
        mixedContent(this);
    };
    handler.StringValueHandler.prototype.parse = function(elem) {
        return elem.textContent;
    };

    handler.CanvasStyleHandler = function(id, d) {

        this.init = function(elem, storage){
            if (elem.hasAttribute(id))
                this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
        }

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            elem._configured.canvas.setAttribute(id, value);
        };

        this.desc = {
            get: function() { return this._configured.canvas.style; },
            set: function(value) {}
        };

    };

    handler.CanvasClassHandler = function(id) {

        this.init = function(elem, storage){
            var canvas = elem._configured.canvas;
            canvas.className = "_xml3d"; // Class name always defined for xml3d canvas
            if (elem.hasAttribute(id))
                this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
        }

        this.setFromAttribute = function(value, prevValue, elem, storage) {
            var canvas = elem._configured.canvas;
            canvas.setAttribute(id, value + " _xml3d");
        };

        this.desc = {
            // TODO: Should we not strip the _xml3d class here?
            get: function() { return this._configured.canvas.className; },
            set: function(value) { this._configured.canvas.className = value; }
        };
    };

    // Export to xml3d namespace
    XML3D.extend(XML3D, handler);

}());
