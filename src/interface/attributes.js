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
    id = id.toLowerCase();
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
    id = id.toLowerCase();
    this.desc = {
        get : function() {
            return this.getAttribute(id) || "";
        },
        set : function(value) {
            this.setAttribute(id, value);
        }
    };
};

handlers.EnumAttributeHandler = function(id, enumObj) {
    AttributeHandler.call(this);
    id = id.toLowerCase();

    this.init = function(elem, storage){
        storage[id] = enumObj.defaultValue;
        if (elem.hasAttribute(id))
            this.setFromAttribute(elem.getAttribute(id), null, elem, storage);
    };
    this.setFromAttribute = function(v, prevValue, elem, storage) {
        var value = v.toLowerCase();
        storage[id] = (value && enumObj.values[value] !== undefined) ? enumObj.values[value] : enumObj.defaultValue;
        return false;
    };
    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
            var storage = getStorage(this);
            return enumObj.values[storage[id]];
        },
        set : function(v) {
                // Attribute is set to whatever comes in
            this.setAttribute(id, v);
            var storage = getStorage(this);
            var value = typeof v == 'string' ? v.toLowerCase() : undefined;
            if (value && enumObj.values[value] !== undefined)
                storage[id] = enumObj.values[value];
            else
                storage[id] = enumObj.defaultValue;
        }
    };
};
handlers.EnumAttributeHandler.prototype = new AttributeHandler();
handlers.EnumAttributeHandler.prototype.constructor = handlers.EnumAttributeHandler;

handlers.EventAttributeHandler = function(id) {
    AttributeHandler.call(this);
    id = id.toLowerCase();
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
            if (XML3D.xhtml) {
                // only XHTML documents require this polyfill for mouse event attributes
                elem.addEventListener(eventType, storage[id], false);
            }
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
            if(XML3D.xhtml && storage[id]) this.removeEventListener(eventType, storage[id]);
            storage[id] = (typeof value == 'function') ? value : undefined;
            if(XML3D.xhtml && storage[id]) this.addEventListener(eventType, storage[id], false);
            return false;
        }
    };
};

handlers.EventAttributeHandler.prototype = new AttributeHandler();
handlers.EventAttributeHandler.prototype.constructor = handlers.EventAttributeHandler;

handlers.IntAttributeHandler = function(id, defaultValue) {
    id = id.toLowerCase();
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
    id = id.toLowerCase();
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
    id = id.toLowerCase();
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

handlers.Vec3AttributeHandler = function(id, defaultValue) {
    var that = this;
    id = id.toLowerCase();

    this.init = function(elem, storage){
        storage[id] = null;
    };

    this.setFromAttribute = function(value, prevValue, elem, storage, init) {
        if (!storage[id]) {
            storage[id] = XML3D.math.vec3.create();
        }
        var v = storage[id];
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(value);
        if (!m  || isNaN(+m[1]) || isNaN(+m[2]) || isNaN(+m[3])) {
            v[0] = defaultValue[0];
            v[1] = defaultValue[1];
            v[2] = defaultValue[2];
            !init && XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, elem);
        } else {
            v[0] = +m[1];
            v[1] = +m[2];
            v[2] = +m[3];
        }
        return false;
    };

    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
            var storage = getStorage(this);
            if (!storage[id]) {
                that.setFromAttribute(this.getAttribute(id), null, this, storage, true);
            }
            return XML3D.math.vec3.clone(storage[id]);
        },
        set : function(value) {
            var storage = getStorage(this);
            if (!storage[id]) {
                that.setFromAttribute(this.getAttribute(id), null, this, storage, true);
            }
            var v = storage[id];
            if (value.length !== 3 || isNaN(value[0]) || isNaN(value[1]) || isNaN(value[2])) {
                XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, this);
                v = defaultValue;
            } else {
                v[0] = value[0]; v[1] = value[1]; v[2] = value[2];
            }
            this.setAttribute(id, XML3D.math.vec3.toDOMString(v));
        }
    };
};

// Note: All vec4 attributes are considered to be axis-angle, NOT quaternions!
handlers.Vec4AttributeHandler = function(id, defaultValue) {
    var that = this;
    id = id.toLowerCase();

    this.init = function(elem, storage){
        storage[id] = null;
    };

    this.setFromAttribute = function(value, prevValue, elem, storage, init) {
        if (!storage[id]) {
            storage[id] = XML3D.math.vec4.create();
        }
        var v = storage[id];
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(value);
        if (!m  || isNaN(+m[1]) || isNaN(+m[2]) || isNaN(+m[3]) || isNaN(+m[4])) {
            XML3D.math.vec4.copy(v, defaultValue);
            !init && XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, elem);
        } else {
            XML3D.math.vec4.set(v, +m[1], +m[2], +m[3], +m[4]);
        }
        return false;
    };

    this.desc = {
        get : function() {
            XML3D.flushDOMChanges();
            var storage = getStorage(this);
            if (!storage[id]) {
                that.setFromAttribute(this.getAttribute(id), null, this, storage, true);
            }
            return XML3D.math.vec4.clone(storage[id]);
        },
        set : function(value) {
            var storage = getStorage(this);
            if (!storage[id]) {
                that.setFromAttribute(this.getAttribute(id), null, this, storage, true);
            }
            var v = storage[id];
            if (value.length !== 4 || isNaN(value[0]) || isNaN(value[1]) || isNaN(value[2]) || isNaN(value[3])) {
                XML3D.debug.logWarning("Invalid attribute ["+id+"] value: " + value, this);
                XML3D.math.vec4.copy(v, defaultValue);
            } else {
                XML3D.math.quat.copy(v, value);
            }
            this.setAttribute(id, XML3D.math.vec4.toDOMString(value));
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
    m = m.map(string2bool);
    return m ? new Uint8Array(m) : new Uint8Array();
};

handlers.StringValueHandler = function(id) {
    mixedContent(this);
};
handlers.StringValueHandler.prototype.parse = function(elem) {
    return elem.textContent;
};

handlers.CanvasStyleHandler = function(id, d) {
    id = id.toLowerCase();
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
    id = id.toLowerCase();
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
