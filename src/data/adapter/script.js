var Events = require("../../interface/notification.js");
var createClass = XML3D.createClass;
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;

var ScriptDataAdapter = function(factory, node) {
    NodeAdapter.call(this, factory, node);
    this.connectedAdapterHandle = null;
    if (node.src) {
        this.connectedAdapterHandle = this.getAdapterHandle(node.src);
        this.connectAdapterHandle(node.name, this.connectedAdapterHandle);
    }
};

createClass(ScriptDataAdapter, NodeAdapter, {

    getScriptType: function () {
        return this.node.type;
    },

    getScript: function () {
        if (this.node.src) {
            return this.externalScript;
        } else {
            return this.node.value;
        }
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        this.notifyOppositeAdapters();
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.NODE_INSERTED:
            case Events.NODE_REMOVED:
            case Events.VALUE_MODIFIED:
                this.notifyOppositeAdapters();
                break;

            case Events.ADAPTER_HANDLE_CHANGED:
                this.externalScript = evt.adapter.script;
                this.notifyOppositeAdapters();
                break;
        }
    }
});

module.exports = ScriptDataAdapter;
