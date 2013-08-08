(function(){


//----------------------------------------------------------------------------------------------------------------------
// Xflow.Graph
//----------------------------------------------------------------------------------------------------------------------

/**
 * The Xflow graph includes the whole dataflow graph
 * @constructor
 */
Xflow.Graph = function(){
    this._nodes = [];
};
var Graph = Xflow.Graph;



/**
 * @return {Xflow.InputNode}
 */
Graph.prototype.createInputNode = function(){
    var node = new Xflow.InputNode(this);
    this._nodes.push(node);
    return node;
};

/**
 * @return {Xflow.DataNode}
 */
Graph.prototype.createDataNode = function(protoNode){
    var node = new Xflow.DataNode(this, protoNode);
    this._nodes.push(node);
    return node;
};


//----------------------------------------------------------------------------------------------------------------------
// Xflow.GraphNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @param {Xflow.Graph} graph
 */
Xflow.GraphNode = function(graph){
    this._graph = graph;
    this._parents = [];
};
var GraphNode = Xflow.GraphNode;



//----------------------------------------------------------------------------------------------------------------------
// Xflow.InputNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @param {Xflow.Graph} graph
 * @extends {Xflow.GraphNode}
 */
Xflow.InputNode = function(graph){
    Xflow.GraphNode.call(this, graph);
    this._name = "";
    this._key = 0;
    this._data = null;
    this._paramName = null;
    this._paramGlobal = false;
    this._dataListener = this.onDataChange.bind(this);
};
Xflow.createClass(Xflow.InputNode, Xflow.GraphNode);
var InputNode = Xflow.InputNode;

InputNode.prototype.onDataChange = function(newValue, notification) {
    var downNote;
    switch(notification){
        case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE: downNote = Xflow.RESULT_STATE.CHANGED_DATA_VALUE; break;
        case Xflow.DATA_ENTRY_STATE.LOAD_START: downNote = Xflow.RESULT_STATE.IMAGE_LOAD_START; break;
        case Xflow.DATA_ENTRY_STATE.LOAD_END: downNote = Xflow.RESULT_STATE.IMAGE_LOAD_START; break;
        default: downNote = Xflow.RESULT_STATE.CHANGED_DATA_SIZE; break;
    }
    notifyParentsOnChanged(this,downNote);
};

Object.defineProperty(InputNode.prototype, "name", {
    /** @param {string} v */
    set: function(v){
        this._name = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {string} */
    get: function(){ return this._name; }
});
Object.defineProperty(InputNode.prototype, "key", {
    /** @param {number} v */
    set: function(v){
        this._key = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {number} */
    get: function(){ return this._key; }
});
Object.defineProperty(InputNode.prototype, "paramName", {
    /** @param {string} v */
    set: function(v){
        this._paramName = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {string} */
    get: function(){ return this._paramName; }
});
Object.defineProperty(InputNode.prototype, "paramGlobal", {
    /** @param {boolean} v */
    set: function(v){
        this._paramGlobal = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {boolean} */
    get: function(){ return this._paramGlobal; }
});
Object.defineProperty(InputNode.prototype, "data", {
    /** @param {Object} v */
    set: function(v){
        var prevDataLoading = false;
        if(this._data) {
            prevDataLoading = this._data._loading;
            this._data.removeListener(this._dataListener);
        }
        this._data = v;
        if(this._data)
            this._data.addListener(this._dataListener);
        if(prevDataLoading != this._data._loading){
            notifyParentsOnChanged(this, this._data._loading ? Xflow.RESULT_STATE.IMAGE_LOAD_START :
                Xflow.RESULT_STATE.IMAGE_LOAD_END);
        }
        Xflow._callListedCallback();
    },
    /** @return {Object} */
    get: function(){ return this._data; }
});


Xflow.createBufferInputNode = function(type, name, size){
    if (size == 0)
        return null;
    var typeId = Xflow.DATA_TYPE_MAP[type];
    var tupleSize = Xflow.DATA_TYPE_TUPLE_SIZE[typeId];
    var arrayType = Xflow.TYPED_ARRAY_MAP[typeId];

    var v = new (arrayType)(size * tupleSize);
    var buffer = new Xflow.BufferEntry(typeId, v);

    var inputNode = XML3D.data.xflowGraph.createInputNode();
    inputNode.data = buffer;
    inputNode.name = name;
    return inputNode;
};

//----------------------------------------------------------------------------------------------------------------------
// Xflow.DataNode
//----------------------------------------------------------------------------------------------------------------------

var c_xflowNodeId = 0;
function getXflowNodeId(){
    return ++c_xflowNodeId;
}

/**
 * @constructor
 * @extends {Xflow.GraphNode}
 */
Xflow.DataNode = function(graph, protoNode){
    Xflow.GraphNode.call(this, graph);

    this._loading = false;
    this._subTreeLoading = false;
    this._imageLoading = false;

    this.id = getXflowNodeId();
    this._isProtoNode = protoNode;
    this._children = [];
    this._sourceNode = null;
    this._protoNode = null;

    this._filterType = 0;
    this._filterMapping = new Xflow.OrderMapping(this);

    this._computeOperator = "";
    this._computeInputMapping = new Xflow.OrderMapping(this);
    this._computeOutputMapping = new Xflow.OrderMapping(this);

    this._channelNode = new Xflow.ChannelNode(this);
    this._listeners = [];

};
Xflow.createClass(Xflow.DataNode, Xflow.GraphNode);
var DataNode = Xflow.DataNode;


/**
 * @constructor
 * @param {Xflow.DataNode} owner
 */
Xflow.Mapping = function(owner){
    this._owner = owner;
};


/**
 * @constructor
 * @extends {Xflow.Mapping}
 * @param {Xflow.DataNode} owner
 */
Xflow.OrderMapping = function(owner){
    Xflow.Mapping.call(this, owner);
    this._names = [];
};
Xflow.createClass(Xflow.OrderMapping, Xflow.Mapping);

/**
 * @constructor
 * @extends {Xflow.Mapping}
 * @param {Xflow.DataNode} owner
 */
Xflow.NameMapping = function(owner){
    Xflow.Mapping.call(this, owner);
    this._destNames = [];
    this._srcNames = [];

};
Xflow.createClass(Xflow.NameMapping, Xflow.Mapping);


Object.defineProperty(DataNode.prototype, "sourceNode", {
    /** @param {?Xflow.DataNode} v */
    set: function(v){
        if(this._sourceNode) removeParent(this, this._sourceNode);
        this._sourceNode = v;
        if(this._sourceNode) addParent(this, this._sourceNode);
        if(!updateNodeLoading(this))
            this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {?Xflow.DataNode} */
    get: function(){ return this._sourceNode; }
});
Object.defineProperty(DataNode.prototype, "protoNode", {
    /** @param {?Xflow.DataNode} v */
    set: function(v){
        if(this._protoNode) removeParent(this, this._protoNode);
        this._protoNode = v;
        if(this._protoNode) addParent(this, this._protoNode);
        if(!updateNodeLoading(this))
            this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {?Xflow.DataNode} */
    get: function(){ return this._protoNode; }
});

DataNode.prototype.setLoading = function(loading){
    if(this._loading != loading){
        this._loading = loading;
        updateSubtreeLoading(this);
        Xflow._callListedCallback();
    }
}


Object.defineProperty(DataNode.prototype, "filterType", {
    /** @param {Xflow.DATA_FILTER_TYPE} v */
    set: function(v){
        this._filterType = v;
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {Xflow.DATA_FILTER_TYPE} */
    get: function(){ return this._filterType; }
});

Object.defineProperty(DataNode.prototype, "filterMapping", {
    /** @param {Xflow.Mapping} v */
    set: function(v){ throw new Error("filterMapping is readonly!");
    },
    /** @return {Xflow.Mapping} */
    get: function(){ return this._filterMapping; }
});

Object.defineProperty(DataNode.prototype, "computeOperator", {
    /** @param {string} v */
    set: function(v){
        this._computeOperator = v;
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {string} */
    get: function(){ return this._computeOperator; }
});
Object.defineProperty(DataNode.prototype, "computeInputMapping", {
    /** @param {Xflow.Mapping} v */
    set: function(v){ throw new Error("computeInputMapping is readonly!");
    },
    /** @return {Xflow.Mapping} */
    get: function(){ return this._computeInputMapping; }
});
Object.defineProperty(DataNode.prototype, "computeOutputMapping", {
    /** @param {Xflow.Mapping} v */
    set: function(v){ throw new Error("computeOutputMapping is readonly!");
    },
    /** @return {Xflow.Mapping} */
    get: function(){ return this._computeOutputMapping; }
});

DataNode.prototype.isProtoNode = function(){
    return this._isProtoNode;
}

/**
 * @param {Xflow.GraphNode} child
 */
DataNode.prototype.appendChild = function(child){
    this._children.push(child);
    addParent(this, child);
    if(!updateNodeLoading(this))
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};
/**
 * @param {Xflow.GraphNode} child
 */
DataNode.prototype.removeChild = function(child){
    Array.erase(this._children, child);
    removeParent(this, child);
    if(!updateNodeLoading(this))
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};
/**
 * @param {Xflow.GraphNode} child
 * @param {Xflow.GraphNode} beforeNode
 */
DataNode.prototype.insertBefore = function(child, beforeNode){
    var idx = this._children.indexOf(beforeNode);
    if(idx == -1)
        this._children.push(child);
    else
        this._children.splice(idx, 0, child);
    addParent(this, child);
    if(!updateNodeLoading(this))
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};
/**
 * remove all children of the DataNode
 */
DataNode.prototype.clearChildren = function(){
    for(var i =0; i < this._children.length; ++i){
        removeParent(this, this._children[i]);
    }
    this._children = [];
    if(!updateNodeLoading(this))
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};

/**
 * Detach this DataNode from all connections, including source- and proto-node references
 */
DataNode.prototype.detachFromParents = function(){
    for(var i =0; i < this._parents.length; ++i){
        var parent = this._parents[i];
        if(parent._sourceNode == this)
            parent.sourceNode = null;
        else if(parent._protoNode == this){
            parent.protoNode = null;
        }
        else{
            parent.removeChild(this);
        }
    }
    this._children = [];
};

/**
 * @const
 */
var filterParser = /^([A-Za-z\s]*)\(([^()]+)\)$/;

/**
 * Set filter by string
 * @param {string} filterString
 */
DataNode.prototype.setFilter = function(filterString){
    filterString = filterString || "";
    var newType = Xflow.DATA_FILTER_TYPE.RENAME;
    var newMapping = null;
    if(filterString){
        var result = filterString.trim().match(filterParser);
        if(result){
            var type = result[1].trim();
            switch(type){
                case "keep": newType = Xflow.DATA_FILTER_TYPE.KEEP; break;
                case "remove": newType = Xflow.DATA_FILTER_TYPE.REMOVE; break;
                case "rename": newType = Xflow.DATA_FILTER_TYPE.RENAME; break;
                default:
                    XML3D.debug.logError("Unknown filter type:" + type);
            }
            newMapping = Xflow.Mapping.parse(result[2], this);
        }
        else{
            XML3D.debug.logError("Could not parse filter '" + filterString + "'");
        }
    }
    if(!newMapping){
        newMapping = new Xflow.OrderMapping(this);
    }
    removeMappingOwner(this._filterMapping);
    this._filterMapping = newMapping;
    this._filterType = newType;
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};

var computeParser = /^(([^=]+)\=)?([^(]+)\(([^()]*)\)$/;
var bracketsParser = /^\(([^()]*)\)$/;

/**
 * Set compute by string
 * @param {string} computeString
 */
DataNode.prototype.setCompute = function(computeString){
    computeString = computeString || "";
    var newOperator = "";
    var inputMapping = null, outputMapping = null;
    var result = computeString.trim().match(computeParser);
    if(result){
        var output = result[2] ? result[2].trim() : "";
        newOperator = result[3].trim();
        var input = result[4] ? result[4].trim() : "";
        if(result = output.match(bracketsParser)){
            output = result[1];
        }
        inputMapping = Xflow.Mapping.parse(input, this);
        outputMapping = Xflow.Mapping.parse(output, this);
    }
    if(!inputMapping) inputMapping = new Xflow.OrderMapping(this);
    if(!outputMapping) outputMapping = new Xflow.OrderMapping(this);
    removeMappingOwner(this._computeInputMapping);
    removeMappingOwner(this._computeOutputMapping);
    this._computeInputMapping = inputMapping;
    this._computeOutputMapping = outputMapping;
    this._computeOperator = newOperator;
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
}
/**
 * Notifies DataNode about a change. Notification will be forwarded to parents, if necessary
 * @param {Xflow.RESULT_STATE} changeType
 * @param {GraphNode} senderNode
 */
DataNode.prototype.notify = function(changeType, senderNode){
    if(changeType == Xflow.RESULT_STATE.CHANGED_STRUCTURE ||
       changeType == Xflow.RESULT_STATE.LOAD_START ||
       changeType == Xflow.RESULT_STATE.LOAD_END )
    {
        this._channelNode.setStructureOutOfSync();

        if(changeType == Xflow.RESULT_STATE.CHANGED_STRUCTURE)
            notifyParentsOnChanged(this, changeType);
        else
            updateSubtreeLoading(this);
    }
    else if(changeType == Xflow.RESULT_STATE.CHANGED_DATA_VALUE ||
        changeType == Xflow.RESULT_STATE.CHANGED_DATA_SIZE ||
        changeType == Xflow.RESULT_STATE.IMAGE_LOAD_START ||
        changeType == Xflow.RESULT_STATE.IMAGE_LOAD_END)
    {
        if(changeType == Xflow.RESULT_STATE.IMAGE_LOAD_START ||
           changeType == Xflow.RESULT_STATE.IMAGE_LOAD_END )
            updateImageLoading(this);
        senderNode && this._channelNode.notifyDataChange(senderNode, changeType);
    }
    for(var i = 0; i < this._listeners.length; ++i)
        this._listeners[i](changeType);
};

DataNode.prototype.addListener = function(listener){
    this._listeners.push(listener)
}
DataNode.prototype.removeListener = function(listener){
    Array.erase(this._listeners, listener);
}

DataNode.prototype.getOutputNames = function(){
    return getForwardNode(this)._channelNode.getOutputNames();
}

DataNode.prototype.getOutputChannelInfo = function(name){
    return getForwardNode(this)._channelNode.getOutputChannelInfo(name);
}
DataNode.prototype.getParamNames = function(){
    return getForwardNode(this)._channelNode.getParamNames();
}

DataNode.prototype._getResult = function(type, filter){
    return getForwardNode(this)._channelNode.getResult(type, filter);
}

DataNode.prototype._getForwardNode = function(){
    return getForwardNode(this);
}

function getForwardNode(dataNode){
    if(!dataNode._filterMapping.isEmpty()  || dataNode._computeOperator || dataNode._protoNode)
        return dataNode;
    if(dataNode._sourceNode && dataNode._children.length == 0)
        return getForwardNode(dataNode._sourceNode);
    if(dataNode._children.length == 1 && dataNode._children[0] instanceof DataNode)
        return getForwardNode(dataNode._children[0]);
    return dataNode;
}

function updateNodeLoading(node){
    updateImageLoading(node);
    return updateSubtreeLoading(node);
}

function updateImageLoading(node){
    var imageLoading = false;
    for(var i = 0; !imageLoading && i < node._children.length; ++i){
        var child = node._children[i];
        imageLoading = child instanceof Xflow.DataNode ? child._imageLoading :
                child._data && child._data.isLoading && child._data.isLoading();
    }
    if(imageLoading != node._imageLoading){
        node._imageLoading = imageLoading;
        for(var i = 0; i < node._parents.length; ++i)
            node._parents[i].notify(imageLoading ? Xflow.RESULT_STATE.IMAGE_LOAD_START :
            Xflow.RESULT_STATE.IMAGE_LOAD_END);
    }
}
function updateSubtreeLoading(node){
    var subtreeLoading = node._loading;
    for(var i = 0; !subtreeLoading && i < node._children.length; ++i){
        var child = node._children[i];
        subtreeLoading = child instanceof Xflow.DataNode ? child._subTreeLoading : false;
    }
    if(subtreeLoading != node._subTreeLoading){
        node._subTreeLoading = subtreeLoading;
        for(var i = 0; i < node._parents.length; ++i)
            node._parents[i].notify(subtreeLoading ? Xflow.RESULT_STATE.LOAD_START :
                Xflow.RESULT_STATE.LOAD_END);
        return true;
    }
    return false;
}


//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------


/**
 * @private
 * @param {Xflow.DataNode} parent
 * @param {Xflow.GraphNode} child
 */
function addParent(parent, child){
    child._parents.push(parent);
}

/**
 * @private
 * @param {Xflow.DataNode} parent
 * @param {Xflow.GraphNode} child
 */
function removeParent(parent, child){
    Array.erase(child._parents, parent);
}

/**
 * Notify all parent nodes about a change
 * @param {Xflow.GraphNode} node
 * @param {number|Xflow.RESULT_STATE} changeType
 * @private
 */
function notifyParentsOnChanged(node, changeType){
    for(var i = 0; i < node._parents.length; ++i){
        node._parents[i].notify(changeType, node);
    }
};

/**
 * Remove owner from mapping, small helper function
 * @param {Xflow.Mapping} mapping
 * @private
 */
function removeMappingOwner(mapping){
    if(mapping)
        mapping._owner = null;
};


})();
