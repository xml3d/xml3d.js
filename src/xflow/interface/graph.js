(function(){
/**
 * Content of this file:
 * Classes to construct an Xflow graph.
 */



//----------------------------------------------------------------------------------------------------------------------
// Xflow.Graph
//----------------------------------------------------------------------------------------------------------------------

/**
 * The Xflow graph includes the whole dataflow graph
 * It is recommended to use one Xflow.Graph per web document.
 * @constructor
 */
Xflow.Graph = function(){
    this.initPlatform();
};

var Graph = Xflow.Graph;

    /**
     *
     */

Graph.prototype.initPlatform = function () {
    this.platform = Xflow.PLATFORM.JAVASCRIPT; // Setting default platform for the graph

    if(initWebCLPlatform(this)) {
        this.platform = Xflow.PLATFORM.CL;
    }

};

function initWebCLPlatform(graph) {
    var clPlatforms, clDevices, clCtx, cmdQueue;
    var webcl = XML3D.webcl;

    if (webcl && webcl.isAvailable()) {

        // Fetching WebCL device platforms
        clPlatforms = webcl.getPlatforms();

        if (!clPlatforms || typeof clPlatforms === 'array' && clPlatforms.length === 0) {
            return false;
        }

        // Fetching WebCL devices
        try {
            // Trying initially to use GPU (for the best performance). Using CPU as a fallback.
            clDevices = webcl.getDevicesByType("GPU") || webcl.getDevicesByType("CPU");
        } catch (e) {
            return false;
        }

        if (!clDevices) {
            return false;
        }

        // Creating a new WebCL context
        try {
            clCtx = webcl.createContext(clDevices);
        } catch (e) {
            return false;
        }

        // Creating a command queue for WebCL processing
        try {
            cmdQueue = webcl.createCommandQueue(clDevices[0], clCtx);
        } catch (e) {
            return false;
        }

        /**
         *  TODO: Maybe we should just store the cl-platform objects in XFlow.cl so they are more easily available and
         *  to avoid long prototype chains. Or we could pass the graph context to each node of the graph.
         *  However, it would be good to allow each Graph object to have at least own context, cmdQueue and kernelManager.
         */
        graph.cl = {
            API: webcl,
            kernelManager: new webcl.KernelManager(clCtx, clDevices),
            platforms: clPlatforms,
            devices: clDevices,
            ctx: clCtx,
            cmdQueue: cmdQueue
        };

        return true;
    }

    return false;
}

 /**
 * @return {Xflow.InputNode}
 */
Graph.prototype.createInputNode = function(){
    var node = new Xflow.InputNode(this);
    return node;
};

/**
 * @return {Xflow.DataNode}
 */
Graph.prototype.createDataNode = function(protoNode){
    var node = new Xflow.DataNode(this, protoNode);
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
 * An InputNode include an Xflow.DataEntry, a name and other information
 * This class mirrors XML3D elements such as <float3>, <int> or <texture>
 *
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
        case Xflow.DATA_ENTRY_STATE.LOAD_END: downNote = Xflow.RESULT_STATE.IMAGE_LOAD_END; break;
        case Xflow.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE: downNote = Xflow.RESULT_STATE.CHANGED_STRUCTURE; break;
        case Xflow.DATA_ENTRY_STATE.CHANGED_SIZE: downNote = Xflow.RESULT_STATE.CHANGED_DATA_SIZE; break;
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

InputNode.prototype._getParamNames = function(){
    return this._paramGlobal ? null : this._paramName;
}
InputNode.prototype._getGlobalParamNames = function(){
    return this._paramGlobal ? this._paramName : null;
}


/**
 * Helper class to create a InputNode with a newly created BufferDataEntry.
 * @param {string} type Type of the DataEntry A string key from Xflow.DATA_TYPE_MAP
 * @param {string} name Name of the InputNode
 * @param {number} size Size of the DataEntry in number of typed values, NOT bytes.
 * @returns {Xflow.InputNode}
 */
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
 * The DataNode is the central structure of an Xflow Graph.
 * It is used to build a data composition graph as well as a data flow.
 * It mirror the <data> element of XML3D
 *
 * @constructor
 * @extends {Xflow.GraphNode}
 */
Xflow.DataNode = function(graph, protoNode){
    Xflow.GraphNode.call(this, graph);

    this._loading = false;
    this._loadLevel = 0;
    this._progressLevel = Infinity;



    this.id = getXflowNodeId();
    this._isProtoNode = protoNode;
    this._children = [];
    this._sourceNode = null;
    this._userData = null;

    this._filterType = 0;
    this._filterMapping = null;

    this._computeOperator = "";
    this._computeUsesDataflow = false;
    this._computeInputMapping = null;
    this._computeOutputMapping = null;
    this._dataflowNode = null;

    this._channelNode = new Xflow.ChannelNode(this);
    this._substitutionNodes = {};
    this._paramNames = null;
    this._globalParamNames = null;

    this._platform = null;

    this._listeners = [];
    this._loadListeners = [];

};
Xflow.createClass(Xflow.DataNode, Xflow.GraphNode);
var DataNode = Xflow.DataNode;


/**
 * A mapping used for a filter or a compute properties of a DataNode
 * @abstract
 * @param {Xflow.DataNode} owner
 */
Xflow.Mapping = function(){
    this._owners = [];
};


/**
 * An OrderMapping used for a filter or compute properties of a DataNode
 * It describes a mapping of names referring to the order of arguments / output values.
 * OrderMapping syntax examples in compute:
 * position = xflow.morph(position, posAdd, weight)
 * @constructor
 * @extends {Xflow.Mapping}
 * @param {Xflow.DataNode} owner
 */
Xflow.OrderMapping = function(){
    Xflow.Mapping.call(this);
    this._names = [];
};
Xflow.createClass(Xflow.OrderMapping, Xflow.Mapping);

/**
 * An NameMapping used for a filter or compute properties of a DataNode
 * It describes a mapping of names referring to the original names of the arguments / output values.
 * NameMapping syntax examples in compute:
 * {position: result} = xflow.morph({value: position, valueAdd: posAdd, weight: weight})
 * @constructor
 * @extends {Xflow.Mapping}
 * @param {Xflow.DataNode} owner
 */
Xflow.NameMapping = function(){
    Xflow.Mapping.call(this);
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
        updateLoadingState(this);
        this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {?Xflow.DataNode} */
    get: function(){ return this._sourceNode; }
});
// TODO: Remove this property once the XML3D part is adapted
Object.defineProperty(DataNode.prototype, "protoNode", {
    /** @param {?Xflow.DataNode} v */
    set: function(v){
        this._computeUsesDataflow = !!v;
        this._computeInputMapping = null;
        this._computeOutputMapping = null;
        this.dataflowNode = v;
    },
    /** @return {?Xflow.DataNode} */
    get: function(){ return this._dataflowNode; }
});
Object.defineProperty(DataNode.prototype, "dataflowNode", {
    /** @param {?Xflow.DataNode} v */
    set: function(v){
        if(v && !this._computeUsesDataflow)
            throw new Error("Cannot set dataflowNode when compute doesn't use dataflow.");
        if(this._dataflowNode) removeParent(this, this._dataflowNode);
        this._dataflowNode = v;
        if(this._dataflowNode) addParent(this, this._dataflowNode);
        updateLoadingState(this);
        this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {?Xflow.DataNode} */
    get: function(){ return this._dataflowNode; }
});


Object.defineProperty(DataNode.prototype, "userData", {
    /** @param {?Xflow.DataNode} v */
    set: function(v){
        this._userData = v;
    },
    /** @return {?Xflow.DataNode} */
    get: function(){ return this._userData; }
});


DataNode.prototype.setLoading = function(loading){
    if(this._loading != loading){
        this._loading = loading;
        updateLoadingState(this);
        Xflow._callListedCallback();
    }
}

DataNode.prototype.isSubtreeLoading = function(){
    return this._progressLevel == 0;
}

DataNode.prototype.getProgressLevel = function(){
    return this._progressLevel;
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
    set: function(v){
        swapMapping(this, "_filterMapping", v);
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {Xflow.Mapping} */
    get: function(){ return this._filterMapping; }
});

Object.defineProperty(DataNode.prototype, "computeOperator", {
    /** @param {string} v */
    set: function(v){
        this._computeOperator = v;
        this._computeUsesDataflow = false;
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {string} */
    get: function(){ return this._computeUsesDataflow ? null : this._computeOperator; }
});

Object.defineProperty(DataNode.prototype, "computeDataflowUrl", {
    /** @param {string} v */
    set: function(v){
        this._computeOperator = v;
        this._computeUsesDataflow = true;
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {string} */
    get: function(){ return this._computeUsesDataflow ? this._computeOperator : null; }
});

Object.defineProperty(DataNode.prototype, "computeInputMapping", {
    /** @param {Xflow.Mapping} v */
    set: function(v){
        swapMapping(this, "_computeInputMapping", v);
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
    },
    /** @return {Xflow.Mapping} */
    get: function(){ return this._computeInputMapping; }
});
Object.defineProperty(DataNode.prototype, "computeOutputMapping", {
    /** @param {Xflow.Mapping} v */
    set: function(v){
        swapMapping(this, "_computeOutputMapping", v);
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._callListedCallback();
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
    updateLoadingState(this);
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};
/**
 * @param {Xflow.GraphNode} child
 */
DataNode.prototype.removeChild = function(child){
    Array.erase(this._children, child);
    removeParent(this, child);
    updateLoadingState(this)
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
    updateLoadingState(this);
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
    updateLoadingState(this);
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
        else if(parent._dataflowNode == this){
            parent.dataflowNode = null;
        }
        else{
            parent.removeChild(this);
        }
    }
    this._children = [];
};

    /**
     * Sets platform of a DataNode. If _platform is defined, it will override the default platform setting of
     * an Xflow graph.
     *
     * @param {String|Xflow.PLATFORM|null} platformSrc
     */

DataNode.prototype.setPlatform = function(platformSrc) {
    if (typeof platformSrc === 'string') {
        if (platformSrc === "cl") {
            this._platform = Xflow.PLATFORM.CL;
        }
        else if (platformSrc === "gl") {
            this._platform = Xflow.PLATFORM.GLSL;
        }
        else if (platformSrc === "js") {
            this._platform = Xflow.PLATFORM.JAVASCRIPT;
        }
    } else if (!isNaN(parseFloat(platformSrc)) && isFinite(platformSrc)) {
        this._platform = platformSrc;
    } else {
        this._platform = null;
    }

    this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
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
                    Xflow.notifyError("Unknown filter type:" + type, this);
            }
            newMapping = Xflow.Mapping.parse(result[2], this);
        }
        else{
            Xflow.notifyError("Could not parse filter '" + filterString + "'", this);
        }
    }
    if(!newMapping){
        // TODO Remove this? (Mapping can be null from now on)
        newMapping = new Xflow.OrderMapping();
    }
    swapMapping(this, "_filterMapping", newMapping);
    this._filterType = newType;
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._callListedCallback();
};

var computeParser = /^(([^=]+)\=)?([^'(]+('[^']+')?[^'(]+)(\(([^()]*)?\))?$/;
var bracketsParser = /^\(([^()]*)\)$/;
var dataflowParser = /^dataflow\['([^']+)'\]$/;

Xflow.getComputeDataflowUrl = function(computeString){
    computeString = computeString || "";
    var newOperator = "";
    var result = computeString.trim().match(computeParser);
    if(result){
        newOperator = result[3].trim();
        if(result = newOperator.match(dataflowParser)){
            return result[1];
        }
        else{
            return null;
        }
    }
}


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
        var input = result[6] ? result[6].trim() : "";
        if(result = output.match(bracketsParser)){
            output = result[1];
        }
        if(input)
            inputMapping = Xflow.Mapping.parse(input, this);
        if(output)
            outputMapping = Xflow.Mapping.parse(output, this);

        if(result = newOperator.match(dataflowParser)){
            this._computeUsesDataflow = true;
            newOperator = result[1];
        }
        else{
            this._computeUsesDataflow = false;
        }
        this._dataflowNode = null;
    }
    else if(computeString){
        Xflow.notifyError("Error parsing Compute value '" + computeString + "'", this);
    }
    swapMapping(this, "_computeInputMapping", inputMapping);
    swapMapping(this, "_computeOutputMapping", outputMapping);
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
    if(changeType == Xflow.RESULT_STATE.CHANGED_STRUCTURE )
    {
        this._paramNames = null;
        this._globalParamNames = null;
        this._channelNode.setStructureOutOfSync();
        clearSubstitutionNodes(this);
        if(changeType == Xflow.RESULT_STATE.CHANGED_STRUCTURE)
            notifyParentsOnChanged(this, changeType);

    }
    else if(changeType == Xflow.RESULT_STATE.CHANGED_DATA_VALUE ||
        changeType == Xflow.RESULT_STATE.CHANGED_DATA_SIZE ||
        changeType == Xflow.RESULT_STATE.IMAGE_LOAD_START ||
        changeType == Xflow.RESULT_STATE.IMAGE_LOAD_END)
    {
        if(changeType == Xflow.RESULT_STATE.IMAGE_LOAD_START ||
           changeType == Xflow.RESULT_STATE.IMAGE_LOAD_END )
            updateLoadingState(this);
        if(senderNode){
            this._channelNode.notifyDataChange(senderNode, changeType);
        }
    }
    for(var i = 0; i < this._listeners.length; ++i)
        this._listeners[i](changeType);
};

DataNode.prototype.addListener = function(listener){
    this._listeners.push(listener)
}

DataNode.prototype.removeListener = function(listener) {
    Array.erase(this._listeners, listener);
}

DataNode.prototype.addLoadListener = function(listener){
    this._loadListeners.push(listener);
}
DataNode.prototype.removeLoadListener = function(listener){
    Array.erase(this._loadListeners, listener);
}

DataNode.prototype._callLoadListeners = function(newLevel, oldLevel){
    var len = this._loadListeners.length;
    for(var i = 0; i < len; ++i){
        this._loadListeners[i](this, newLevel, oldLevel);
    }
}

DataNode.prototype.getOutputNames = function(){
    return getForwardNode(this)._channelNode.getOutputNames();
}

DataNode.prototype.getOutputChannelInfo = function(name){
    return getForwardNode(this)._channelNode.getOutputChannelInfo(name);
}
DataNode.prototype.getParamNames = function(){
    return this._getParamNames();
}

DataNode.prototype._getResult = function(type, filter){
    return getForwardNode(this, filter)._channelNode.getResult(type, filter);
}

DataNode.prototype._getForwardNode = function(filter){
    return getForwardNode(this, filter);
}

DataNode.prototype._getParamNames = function(){
    if(!this._paramNames){
        this._paramNames = [];
        if(this._sourceNode)
            Xflow.nameset.add(this._paramNames, this._sourceNode._getParamNames());
        else{
            for(var i = 0; i < this._children.length; ++i){
                Xflow.nameset.add(this._paramNames, this._children[i]._getParamNames());
            }
        }
    }
    return this._paramNames;
};
DataNode.prototype._getGlobalParamNames = function(){
    if(!this._globalParamNames){
        this._globalParamNames = [];
        if(this._dataflowNode)
            Xflow.nameset.add(this._globalParamNames, this._dataflowNode._getGlobalParamNames());

        if(this._sourceNode)
            Xflow.nameset.add(this._globalParamNames, this._sourceNode._getGlobalParamNames());
        else{
            for(var i = 0; i < this._children.length; ++i){
                Xflow.nameset.add(this._globalParamNames, this._children[i]._getGlobalParamNames());
            }
        }
    }
    return this._globalParamNames;
};

DataNode.prototype._getChannelNode = function(substitution){
    if(!substitution)
        return this._channelNode
    else{
        var key = substitution.getKey(this);
        if(!this._substitutionNodes[key])
            this._substitutionNodes[key] = new Xflow.ChannelNode(this, substitution);
        else
            this._substitutionNodes[key].increaseRef();
        return this._substitutionNodes[key];
    }
}

DataNode.prototype._removeSubstitutionNode = function(substitutionNode){
    var key = substitutionNode.substitution.getKey(this);
    if(this._substitutionNodes[key] && this._substitutionNodes[key].decreaseRef())
        delete this._substitutionNodes[key];
}

function clearSubstitutionNodes(dataNode){
    for(var name in dataNode._substitutionNodes){
        dataNode._substitutionNodes[name].clear();
    }
    dataNode._substitutionNodes = {};
}


function getForwardNode(dataNode, filter){
    var filteredBadly = (dataNode._filterMapping && !dataNode._filterMapping.isEmpty());
    if(!filteredBadly){
        if(!dataNode._computeOperator ){
            if(dataNode._sourceNode && dataNode._children.length == 0)
                return getForwardNode(dataNode._sourceNode);
            if(dataNode._children.length == 1 && dataNode._children[0] instanceof DataNode)
                return getForwardNode(dataNode._children[0]);
        }
        var idx = dataNode._channelNode.getChildDataIndex(filter);
        if(idx != -1 && idx != undefined){
            if(dataNode._sourceNode)
                return getForwardNode(dataNode._sourceNode);
            else
                return getForwardNode(dataNode._children[idx]);
        }
    }
    return dataNode;
}



function updateLoadingState(node){
    var progressLevel = node._loading ? node._loadLevel : Infinity;

    for(var i = 0; progressLevel && i < node._children.length; ++i){
        var child = node._children[i];
        if(child instanceof Xflow.DataNode){
            progressLevel = Math.min(progressLevel, Math.max(child._loadLevel, child._progressLevel) );
        }
        else if(child._data && child._data.isLoading && child._data.isLoading()){
            progressLevel = Math.min(progressLevel, 1);
        }
    }
    if(progressLevel && node._sourceNode){
        progressLevel = Math.min(progressLevel, Math.max(node._sourceNode._loadLevel, node._sourceNode._progressLevel));
    }
    if(progressLevel && node._dataflowNode){
        progressLevel = Math.min(progressLevel, Math.max(node._dataflowNode._loadLevel, node._dataflowNode._progressLevel));
    }
    var oldLevel = node._progressLevel;
    node._progressLevel = progressLevel;

    if(oldLevel != node._progressLevel){
        node._callLoadListeners(node._progressLevel, oldLevel);
        for(var i = 0; i < node._parents.length; ++i)
            updateLoadingState(node._parents[i]);
    }
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

function swapMapping(dataNode, key, mapping){
    dataNode[key] && dataNode[key]._removeOwner(dataNode);
    dataNode[key] = mapping;
    dataNode[key] && dataNode[key]._addOwner(dataNode);
}


})();
