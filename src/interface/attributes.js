require("../utils/array.js");
var Resource = require("../base/resourcemanager.js").Resource;

var string2bool = function(string) {
    if (!string) {
        return false;
    }
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
};
var handlers = {};

function getStorage(elem){
    return elem._configured.storage;
}

var AttributeHandler = function(elem) {
};

handlers.IDHandler = function(id) {
    this.setFromAttribute = function(value, prevValue, elem) {
        Resource.notifyNodeIdChange(elem, prevValue, value);
    };
    this.desc = {
        get : function() {
            return this.getAttribute(id) || "";
        },
        set : function(value) {
            this.setAttribute(id, value);
        }
    };
};

handlers.StringAttributeHandler = function(id) {
    this.desc = {
        get : function() {
            return this.getAttribute(id) || "";
        },
        set : function(value) {
            this.setAttribute(id, value);
        }
    };
};

handlers.EnumAttributeHandler = function(id, p) {
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
            XML3D.flushDOMChanges();
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
handlers.EnumAttributeHandler.prototype = new AttributeHandler();
handlers.EnumAttributeHandler.prototype.constructor = handlers.EnumAttributeHandler;

handlers.EventAttributeHandler = function(id) {
    AttributeHandler.call(this);
    var eventType = id.substring(2);

    this.init = function(elem, storage){
        storage[id] = null;
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };

    this.setFromAttribute = function(value, prevValue, elem, storage) {
        if(storage[id] != null)
            elem.removeEventListener(eventType, storage[id]);
        if(!value){
            storage[id] = null;
        }
        else{
            storage[id] = eval("crx = function " + id + "(event){\n  " + value + "\n}");
            elem.addEventListener(eventType, storage[id], false);
        }
        return false;
    };
    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
            var storage = getStorage(this);
            return storage[id];
        },
        set : function(value) {
            var storage = getStorage(this);
            if(storage[id]) this.removeEventListener(eventType, storage[id]);
            storage[id] = (typeof value == 'function') ? value : undefined;
            if(storage[id]) this.addEventListener(eventType, storage[id], false);
            return false;
        }
    };
};

handlers.EventAttributeHandler.prototype = new AttributeHandler();
handlers.EventAttributeHandler.prototype.constructor = handlers.EventAttributeHandler;

handlers.IntAttributeHandler = function(id, defaultValue) {

    this.init = function(elem, storage){
        storage[id] = defaultValue;
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };

    this.setFromAttribute = function(value, prevValue, elem, storage) {
        var v = value.match(/^\d+/);
        if (!v || isNaN(+v[0])) {
            XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, elem);
            elem.setAttribute(id, prevValue);
            storage[id] = defaultValue;
        } else {
            storage[id] =  +v[0];
        }
        if(elem._configured.canvas)
            elem._configured.canvas[id] = storage[id];
        return false;
    };

    this.desc = {
        get : function(){
            XML3D.flushDOMChanges();
            var storage = getStorage(this);
            return storage[id];
        },
        set : function(value) {
            var storage = getStorage(this);
            var v = +value;
            if (isNaN(v)) {
                XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, this);
                storage[id] = defaultValue;
            } else {
                storage[id] =  Math.floor(v);
            }
            this.setAttribute(id, storage[id] + '');
        }
    };
};
handlers.IntAttributeHandler.prototype = new AttributeHandler();
handlers.IntAttributeHandler.prototype.constructor = handlers.IntAttributeHandler;

handlers.FloatAttributeHandler = function(id, defaultValue) {

    this.init = function(elem, storage){
        storage[id] = defaultValue;
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };

    this.setFromAttribute = function(value, prevValue, elem, storage) {
        var v = +value;
        if (isNaN(v)) {
            XML3D.debug.logWarning("Invalid attribute value: " + value, elem);
            elem.setAttribute(id, prevValue);
            storage[id] = defaultValue;
        } else {
            storage[id] =  v;
        }
        return false;
    };

    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
            var storage = getStorage(this);
            return storage[id];
        },
        set : function(value) {
            var storage = getStorage(this);
            var v = +value;
            if (isNaN(v)) {
                XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, this);
                storage[id] = defaultValue;
            } else {
                storage[id] =  v;
            }
            this.setAttribute(id, storage[id] + '');
        }
    };
};

handlers.BoolAttributeHandler = function(id, defaultValue) {
    this.init = function(elem, storage){
        storage[id] = defaultValue;
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };
    this.setFromAttribute = function(value, prevValue, elem, storage) {
        storage[id] = string2bool(value);
        return false;
    };

    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
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

handlers.XML3DVec3AttributeHandler = function(id, d) {
    var that = this;

    this.init = function(elem, storage){
        storage[id] = null;
    };

    this.initVec3 = function(elem, storage, x, y, z){
        var changed = function(value) {
            elem.setAttribute(id, value.x + " " + value.y + " " + value.z);
        };
        storage[id] = new window.XML3DVec3(x, y, z, changed);
    };

    this.setFromAttribute = function(value, prevValue, elem, storage) {
        if (!storage[id]) {
            var initializing = true;
            this.initVec3(elem, storage, 0, 0, 0);
        }
        var v = storage[id];
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(value);
        if (!m || isNaN(+m[1]) || isNaN(+m[2]) || isNaN(+m[3])) {
            v._data.set(d);
            !initializing && XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, elem);
        } else {
            v._data[0] = +m[1];
            v._data[1] = +m[2];
            v._data[2] = +m[3];
        }
        return false;
    };

    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
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

handlers.XML3DRotationAttributeHandler = function(id, d) {
    var that = this;

    this.init = function(elem, storage){
        storage[id] = null;
    };

    this.initRotation = function(elem, storage){
        var changed = function(v) {
            elem.setAttribute(id, v.axis.x + " " + v.axis.y + " " + v.axis.z + " " + v.angle);
        };
        storage[id] = new window.XML3DRotation(null, null, changed);
    };

    this.setFromAttribute = function(value, prevValue, elem, storage) {
        if (!storage[id]) {
            var initializing = true;
            this.initRotation(elem, storage);
        }
        var v = storage[id];
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(value);
        if (!m  || isNaN(+m[1]) || isNaN(+m[2]) || isNaN(+m[3]) || isNaN(+m[4])) {
            v._axis._data[0] = d[0];
            v._axis._data[1] = d[1];
            v._axis._data[2] = d[2];
            v._angle = d[3];
            v._updateQuaternion();
            !initializing && XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, elem);
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
            XML3D.flushDOMChanges();
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
    };
    handler.desc = {
        get : function() {
            XML3D.flushDOMChanges();
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

handlers.FloatArrayValueHandler = function(id) {
    mixedContent(this);
};

handlers.FloatArrayValueHandler.prototype.parse = function(elem) {
    var exp = /([+\-0-9eE\.]+)/g;
    var str = getContent(elem);
    var m = str.match(exp);
    return m ? new Float32Array(m) : new Float32Array();
};

handlers.Float2ArrayValueHandler = handlers.FloatArrayValueHandler;
handlers.Float3ArrayValueHandler = handlers.FloatArrayValueHandler;
handlers.Float4ArrayValueHandler = handlers.FloatArrayValueHandler;
handlers.Float4x4ArrayValueHandler = handlers.FloatArrayValueHandler;

handlers.IntArrayValueHandler = function(id) {
    mixedContent(this);
};
handlers.IntArrayValueHandler.prototype.parse = function(elem) {
    var exp = /([+\-0-9]+)/g;
    var str = getContent(elem);
    var m = str.match(exp);
    return m ? new Int32Array(m) : new Int32Array();
};

handlers.BoolArrayValueHandler = function(id) {
    mixedContent(this);
};
handlers.BoolArrayValueHandler.prototype.parse = function(elem) {
    var exp = /(true|false|0|1)/ig;
    var str = getContent(elem);
    var m = str.match(exp);
    if (!m)
        return new Uint8Array();
    m = Array.map(m, string2bool);
    return m ? new Uint8Array(m) : new Uint8Array();
};

handlers.StringValueHandler = function(id) {
    mixedContent(this);
};
handlers.StringValueHandler.prototype.parse = function(elem) {
    return elem.textContent;
};

handlers.CanvasStyleHandler = function(id, d) {

    this.init = function(elem, storage){
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };

    this.setFromAttribute = function(value, prevValue, elem, storage) {
        elem._configured.canvas.setAttribute(id, value);
    };

    this.desc = {
        get: function() { return this._configured.canvas.style; },
        set: function(value) {}
    };

};

handlers.CanvasClassHandler = function(id) {

    this.init = function(elem, storage){
        var canvas = elem._configured.canvas;
        canvas.className = "_xml3d"; // Class name always defined for xml3d canvas
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };

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

module.exports = handlers;
