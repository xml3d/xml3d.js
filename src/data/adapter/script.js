var createClass = XML3D.createClass;
var NodeAdapter = XML3D.base.NodeAdapter;

var ScriptDataAdapter = function(factory, node) {
    NodeAdapter.call(this, factory, node);
    this.connectedAdapterHandle = null;
    if (node.src) {
        this.connectedAdapterHandle = this.getAdapterHandle(node.src);
        this.connectAdapterHandle(node.name, this.connectedAdapterHandle);
    } else if (this.node.value) {
        window.eval(this.node.value);
    }
};
createClass(ScriptDataAdapter, NodeAdapter);

ScriptDataAdapter.prototype.getScriptType = function(){
    return this.node.type;
};

ScriptDataAdapter.prototype.getScript = function(){
    return this.node.value;
};

ScriptDataAdapter.prototype.notifyChanged = function(evt) {
    switch(evt.type){
        case XML3D.events.VALUE_MODIFIED:
        case XML3D.events.NODE_INSERTED:
        case XML3D.events.NODE_REMOVED:
            this.notifyOppositeAdapters();
            break;

        case XML3D.events.ADAPTER_HANDLE_CHANGED:
            if (evt.adapter.script) {
                window.eval(evt.adapter.script);
            }
            this.notifyOppositeAdapters();
            break;
    }
};

module.exports = ScriptDataAdapter;