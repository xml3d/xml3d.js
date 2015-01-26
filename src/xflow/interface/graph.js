/**
 * Content of this file:
 * Classes to construct an Xflow graph.
 */

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Graph
//----------------------------------------------------------------------------------------------------------------------

// TODO: Do we still require Graph?
/**
 * The Xflow graph includes the whole dataflow graph
 * It is recommended to use one Xflow.Graph per web document.
 * @constructor
 */
var Graph = function(){
    this.initPlatform();
};


/**
 *  Decides which platform to use
 */
Graph.prototype.initPlatform = function () {
    this.platform = Xflow.PLATFORM.JAVASCRIPT; // Setting default platform for the graph

    if(initWebCLPlatform(this)) {
        this.platform = Xflow.PLATFORM.CL;
    }

};

/**
 * Checks if WebCL is available and attaches a context to the graph
 * @param graph Graph the context will be attached to
 * @returns {boolean}
 */
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
 * @return {InputNode}
 */
Graph.prototype.createInputNode = function(){
    var node = new InputNode(this);
    return node;
};

/**
 * @return {DataNode}
 */
Graph.prototype.createDataNode = function(protoNode){
    var node = new DataNode(this, protoNode);
    return node;
};


//----------------------------------------------------------------------------------------------------------------------
// Xflow.GraphNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * Base class for other graph nodes
 * @constructor
 * @abstract
 * @param {Graph} graph Reference to parent graph
 */
var GraphNode = function(graph){
    this._graph = graph;
    /**
     * All nodes that add a dependency to this node
     * @type array<GraphNode>
     **/
    this._parents = [];
};


//----------------------------------------------------------------------------------------------------------------------
// Xflow.InputNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * An InputNode include an Xflow.DataEntry, a name and other information
 * This class mirrors XML3D elements such as <float3>, <int> or <texture>
 *
 * @constructor
 * @param {Graph} graph
 * @extends {GraphNode}
 */
var InputNode = function(graph){
    GraphNode.call(this, graph);
    /**
     * Name of the input node
     * @type {string}
     * @private
     */
    this._name = "";
    /**
     * Sequence key
     * @type {number}
     * @private
     */
    this._key = 0;
    /**
     * DataEntry node that holds the value
     * @type {DataEntry|null}
     * @private
     */
    this._data = null;
    /**
     * If this nodes is a parameter within a <dataflow>
     * this is set to the name of the parameter, otherwise null
     * @type {null|String}
     * @private
     */
    this._paramName = null;

    /**
     * Experimental! Apply different override logic in order
     * to propagate global parameters to the source of the graph
     * Could be used for instance for LOD concepts, where the
     * renderer propagates the distance along the graph
     * @type {boolean}
     * @private
     */
    this._paramGlobal = false;

    /**
     *  Cache listener for DataEntry
     *  @see {InputNode.onDataChange}
     */
    this._dataListener = this.onDataChange.bind(this);
};
Xflow.createClass(InputNode, GraphNode);

/**
 * Propagate events from DataEntry to parent nodes
 * @param {Object} newValue
 * @param {Xflow.DATA_ENTRY_STATE} notification
 */
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
        Xflow._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._name; }
});

Object.defineProperty(InputNode.prototype, "key", {
    /** @param {number} v */
    set: function(v){
        this._key = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {number} */
    get: function(){ return this._key; }
});

Object.defineProperty(InputNode.prototype, "paramName", {
    /** @param {string} v */
    set: function(v){
        this._paramName = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._paramName; }
});

Object.defineProperty(InputNode.prototype, "paramGlobal", {
    /** @param {boolean} v */
    set: function(v){
        this._paramGlobal = v;
        notifyParentsOnChanged(this, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {boolean} */
    get: function(){ return this._paramGlobal; }
});

Object.defineProperty(InputNode.prototype, "data", {
    /** @param {DataEntry} dataEntry */
    set: function(dataEntry){
        var prevDataLoading = false;
        if(this._data) {
            prevDataLoading = this._data._loading;
            this._data.removeListener(this._dataListener);
        }
        this._data = dataEntry;
        if(this._data)
            this._data.addListener(this._dataListener);
        if(prevDataLoading != this._data._loading){
            notifyParentsOnChanged(this, this._data._loading ? Xflow.RESULT_STATE.IMAGE_LOAD_START :
                Xflow.RESULT_STATE.IMAGE_LOAD_END);
        }
        Xflow._flushResultCallbacks();
    },
    /** @return {DataEntry} */
    get: function(){ return this._data; }
});

/**
 * Getter for local parameter name, returns null if this is a global
 * parameter
 *
 * @returns {null|String}
 * @private
 */
InputNode.prototype._getParamNames = function(){
    return this._paramGlobal ? null : this._paramName;
};

/**
 * Getter for global parameter name, returns null if this is not a global
 * parameter
 *
 * @returns {null|String}
 * @private
 */
InputNode.prototype._getGlobalParamNames = function(){
    return this._paramGlobal ? this._paramName : null;
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
 * @param {Graph} graph Context graph
 * @param {boolean} isDataFlow is this node a dataflow
 * @extends {GraphNode}
 */
var DataNode = function(graph, isDataFlow){
    GraphNode.call(this, graph);

    /**
     * Marker, if this data node is expecting data. Xflow
     * is not monitoring any load events. This must be set
     * from external
     * @type {boolean}
     * @private
     */
    this._loading = false;

    /**
     * Experimental! Priority. How important is this data?
     * 0: Very important
     * @type {number}
     * @private
     */
    this._loadLevel = 0;

    /**
     * Used for loading events: If progress level
     * reaches infinity, loading events are triggered
     * @type {Number}
     * @private
     */
    this._progressLevel = Infinity;

    /**
     * Globally unique id
     */
    this.id = getXflowNodeId();

    /**
     * Is this node a proto node
     * @type {boolean}
     */
    this._isProtoNode = isDataFlow;

    /**
     * Children. InputNodes and DataNodes (as found in DOM)
     * @type {Array}
     * @private
     */
    this._children = [];

    /**
     * The DataNode that has been reference via src
     * @type {DataNode}
     * @private
     */
    this._sourceNode = null;

    /**
     * Field to attach custom data
     * @type {null|Object}
     * @private
     */
    this._userData = null;

    /**
     * The filter type of this node (keep, rename, remove ...)
     * @type {DATA_FILTER_TYPE}
     * @private
     */
    this._filterType = Xflow.DATA_FILTER_TYPE.NONE;

    /**
     * Define the mapping
     * @type {OrderMapping|NameMapping|null}
     * @private
     */
    this._filterMapping = null;

    /**
     * String identifier for operator
     * TODO: Operator class
     * @type {string|Object}
     * @private
     */
    this._computeOperator = "";

    /**
     * True, if compute is a dataflow reference
     * @type {boolean}
     * @private
     */
    this._computeUsesDataflow = false;

    /**
     * Mapping for input of operator,
     * e.g. (position, texcoord) or ({position: pos, texcoord: uv})
     * @type {OrderMapping|NameMapping}
     * @private
     */
    this._computeInputMapping = null;

    /**
     * Mapping for output of operator,
     * e.g. (position, texcoord) = ... or {position: pos, texcoord: uv} = ...
     * @type {OrderMapping|NameMapping}
     * @private
     */
    this._computeOutputMapping = null;

    /**
     * If dataflow node has been resolved, this
     * entry is set
     * @type {DataNode}
     * @private
     */
    this._dataflowNode = null;

    /**
     * Internal (optimized) version of this data node
     * @type {Xflow.ChannelNode}
     * @private
     */
    this._channelNode = new Xflow.ChannelNode(this);

    /**
     * Map of cached channel nodes for dataflow instances with varying
     * input arguments (specialized nodes)
     * TODO: Use WeakMap?
     * @type {Object.<string, ChannelNode>}
     * @private
     */
    this._substitutionNodes = {};

    /**
     * Cached version of local param names collected from
     * children
     * @type {Array.<string>}
     * @private
     */
    this._paramNames = null;

    /**
     * Cached version of global param names collected from
     * children
     * @type {Array.<string>}
     * @private
     */
    this._globalParamNames = null;

    /**
     * Platform, this data node should be executed on
     * TODO: This should be implicit, not explicit
     * @type {null}
     * @private
     */
    this._platform = null;

    /**
     * Observers of the node's Xflow.RESULT_STATE
     * @type {Array}
     * @private
     */
    this._listeners = [];

    /**
     * Observers of the node's progress level
     * @type {Array}
     * @private
     */
    this._loadListeners = [];

};
Xflow.createClass(DataNode, GraphNode);


Object.defineProperty(DataNode.prototype, "sourceNode", {
    /** @param {?DataNode} v */
    set: function(v){
        if(this._sourceNode) removeParent(this, this._sourceNode);
        this._sourceNode = v;
        if(this._sourceNode) addParent(this, this._sourceNode);
        updateProgressLevelAndUpdateListeners(this);
        this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {?DataNode} */
    get: function(){ return this._sourceNode; }
});

Object.defineProperty(DataNode.prototype, "dataflowNode", {
    /** @param {?DataNode} v */
    set: function(v){
        if(v && !this._computeUsesDataflow)
            throw new Error("Cannot set dataflowNode when compute doesn't use dataflow.");
        if(this._dataflowNode) removeParent(this, this._dataflowNode);
        this._dataflowNode = v;
        if(this._dataflowNode) addParent(this, this._dataflowNode);
        updateProgressLevelAndUpdateListeners(this);
        this.notify(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {?DataNode} */
    get: function(){ return this._dataflowNode; }
});


Object.defineProperty(DataNode.prototype, "userData", {
    /** @param {?DataNode} v */
    set: function(v){
        this._userData = v;
    },
    /** @return {?DataNode} */
    get: function(){ return this._userData; }
});

/**
 * Set (from external) if more data is expected.
 * @param {boolean} loading
 */
DataNode.prototype.setLoading = function(loading){
    if(this._loading != loading){
        this._loading = loading;
        updateProgressLevelAndUpdateListeners(this);
        Xflow._flushResultCallbacks();
    }
};

/**
 * Returns if this or any child node is loading
 * @returns {boolean}
 */
DataNode.prototype.isSubtreeLoading = function(){
    return this._progressLevel == 0;
};

/**
 * @returns {Number}
 */
DataNode.prototype.getProgressLevel = function(){
    return this._progressLevel;
};


Object.defineProperty(DataNode.prototype, "filterType", {
    /** @param {Xflow.DATA_FILTER_TYPE} v */
    set: function(v){
        this._filterType = v;
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {Xflow.DATA_FILTER_TYPE} */
    get: function(){ return this._filterType; }
});

Object.defineProperty(DataNode.prototype, "filterMapping", {
    /** @param {Mapping} v */
    set: function(v){
        swapMapping(this, "_filterMapping", v);
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {Mapping} */
    get: function(){ return this._filterMapping; }
});

Object.defineProperty(DataNode.prototype, "computeOperator", {
    /** @param {string} v */
    set: function(v){
        this._computeOperator = v;
        this._computeUsesDataflow = false;
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
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
        Xflow._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._computeUsesDataflow ? this._computeOperator : null; }
});

Object.defineProperty(DataNode.prototype, "computeInputMapping", {
    /** @param {Mapping} v */
    set: function(v){
        swapMapping(this, "_computeInputMapping", v);
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {Mapping} */
    get: function(){ return this._computeInputMapping; }
});
Object.defineProperty(DataNode.prototype, "computeOutputMapping", {
    /** @param {Mapping} v */
    set: function(v){
        swapMapping(this, "_computeOutputMapping", v);
        this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        Xflow._flushResultCallbacks();
    },
    /** @return {Mapping} */
    get: function(){ return this._computeOutputMapping; }
});

DataNode.prototype.isProtoNode = function(){
    return this._isProtoNode;
};

/**
 * @param {GraphNode} child
 */
DataNode.prototype.appendChild = function(child){
    this._children.push(child);
    addParent(this, child);
    updateProgressLevelAndUpdateListeners(this);
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._flushResultCallbacks();
};
/**
 * @param {GraphNode} child
 */
DataNode.prototype.removeChild = function(child){
    Array.erase(this._children, child);
    removeParent(this, child);
    updateProgressLevelAndUpdateListeners(this);
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._flushResultCallbacks();
};

/**
 * @param {GraphNode} child
 * @param {GraphNode} beforeNode
 */
DataNode.prototype.insertBefore = function(child, beforeNode){
    var idx = this._children.indexOf(beforeNode);
    if(idx == -1)
        this._children.push(child);
    else
        this._children.splice(idx, 0, child);
    addParent(this, child);
    // TODO: Next three calls on all structural changes. Add Method
    updateProgressLevelAndUpdateListeners(this);
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._flushResultCallbacks();
};

/**
 * remove all children of the DataNode
 */
DataNode.prototype.clearChildren = function(){
    for(var i =0; i < this._children.length; ++i){
        removeParent(this, this._children[i]);
    }
    this._children = [];
    updateProgressLevelAndUpdateListeners(this);
    this.notify( Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    Xflow._flushResultCallbacks();
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
    Xflow._flushResultCallbacks();
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
    Xflow._flushResultCallbacks();
};

var computeParser = /^(([^=]+)\=)?([^'(]+('[^']+')?[^'(]+)(\(([^()]*)?\))?$/;
var bracketsParser = /^\(([^()]*)\)$/;
var dataflowParser = /^dataflow\['([^']+)'\]$/;

/**
 * If the compute string contains a reference to an external dataflow,
 * the parser returns its URL. Null, otherwise
 * @param computeString
 * @returns {string|null}
 */
Xflow.getComputeDataflowUrl = function(computeString){
    computeString = computeString || "";
    var newOperator = "";
    var result = computeString.trim().match(computeParser);
    if(result){
        newOperator = result[3].trim();
        if(result = newOperator.match(dataflowParser)){
            return result[1];
        }
    }
    return null;
};


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
    Xflow._flushResultCallbacks();
};




/**
 * Notifies DataNode about a change. Notification will be forwarded to parents, if necessary
 * @param {Xflow.RESULT_STATE} changeType
 * @param {GraphNode?} senderNode
 */
DataNode.prototype.notify = function(changeType, senderNode){
    if(changeType == Xflow.RESULT_STATE.CHANGED_STRUCTURE )
    {
        this._paramNames = null;
        this._globalParamNames = null;
        this._channelNode.setStructureOutOfSync();
        clearSubstitutionNodes(this);
        notifyParentsOnChanged(this, changeType);
    }
    else if(changeType == Xflow.RESULT_STATE.CHANGED_DATA_VALUE ||
        changeType == Xflow.RESULT_STATE.CHANGED_DATA_SIZE ||
        changeType == Xflow.RESULT_STATE.IMAGE_LOAD_START ||
        changeType == Xflow.RESULT_STATE.IMAGE_LOAD_END)
    {
        if(changeType == Xflow.RESULT_STATE.IMAGE_LOAD_START ||
           changeType == Xflow.RESULT_STATE.IMAGE_LOAD_END )
            updateProgressLevelAndUpdateListeners(this);
        if(senderNode){
            this._channelNode.notifyDataChange(senderNode, changeType);
        }
    }
    // Inform listeners (e.g. Requests)
    for(var i = 0; i < this._listeners.length; ++i) {
        this._listeners[i](changeType);
    }
};

DataNode.prototype.addListener = function(listener){
    this._listeners.push(listener)
};

DataNode.prototype.removeListener = function(listener) {
    Array.erase(this._listeners, listener);
};

DataNode.prototype.addLoadListener = function(listener){
    this._loadListeners.push(listener);
};

DataNode.prototype.removeLoadListener = function(listener){
    Array.erase(this._loadListeners, listener);
};

DataNode.prototype._callLoadListeners = function(newLevel, oldLevel){
    var len = this._loadListeners.length;
    for(var i = 0; i < len; ++i){
        this._loadListeners[i](this, newLevel, oldLevel);
    }
};

DataNode.prototype.getOutputNames = function(){
    return getForwardNode(this)._channelNode.getOutputNames();
};

DataNode.prototype.getOutputChannelInfo = function(name){
    return getForwardNode(this)._channelNode.getOutputChannelInfo(name);
};

DataNode.prototype.getParamNames = function(){
    return this._getParamNames();
};

DataNode.prototype._getResult = function(type, filter){
    return getForwardNode(this, filter)._channelNode.getResult(type, filter);
};

DataNode.prototype._getForwardNode = function(filter){
    return getForwardNode(this, filter);
};

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

/**
 * @param {ChannelNode} substitution
 * @returns {ChannelNode}
 * @private
 */
DataNode.prototype._getChannelNode = function(substitution){
    if(!substitution)
        return this._channelNode;
    else{
        var key = substitution.getKey(this);
        if(!this._substitutionNodes[key]) {
            this._substitutionNodes[key] = new Xflow.ChannelNode(this, substitution);
        } else {
            this._substitutionNodes[key].increaseRef();
        }
        return this._substitutionNodes[key];
    }
};

/**
 * Remove ChannelNode passed as argument from internal substitution nodes
 * Decreases reference counter of substitution node and deletes it if not
 * used by any other node.
 * @param {ChannelNode} substitutionNode
 * @private
 */
DataNode.prototype._removeSubstitutionNode = function(substitutionNode){
    var key = substitutionNode.substitution.getKey(this);
    if(this._substitutionNodes[key] && this._substitutionNodes[key].decreaseRef())
        delete this._substitutionNodes[key];
};

/**
 * Calls clear of all substitutionNodes and clears the map
 * @param {DataNode} dataNode
 */
function clearSubstitutionNodes(dataNode){
    for(var name in dataNode._substitutionNodes){
        dataNode._substitutionNodes[name].clear();
    }
    dataNode._substitutionNodes = {};
}

/**
 * Skips nodes, if it does not contribute to the result (optimization)
 * @param {DataNode} dataNode
 * @param {array.<string>?} filter
 * @returns {DataNode}
 */
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


/**
 * Computes the progress level
 * @private
 * @param {DataNode} node
 */
function updateProgressLevelAndUpdateListeners(node){
    var progressLevel = node._loading ? node._loadLevel : Infinity;

    for(var i = 0; progressLevel && i < node._children.length; ++i){
        var child = node._children[i];
        if(child instanceof DataNode){
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
            updateProgressLevelAndUpdateListeners(node._parents[i]);
    }
}


//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------


/**
 * @private
 * @param {DataNode} parent
 * @param {GraphNode} child
 */
function addParent(parent, child){
    child._parents.push(parent);
}

/**
 * @private
 * @param {DataNode} parent
 * @param {GraphNode} child
 */
function removeParent(parent, child){
    Array.erase(child._parents, parent);
}

/**
 * Notify all parent nodes about a change
 * @param {GraphNode} node
 * @param {number|Xflow.RESULT_STATE} changeType
 * @private
 */
function notifyParentsOnChanged(node, changeType){
    for(var i = 0; i < node._parents.length; ++i){
        node._parents[i].notify(changeType, node);
    }
}

/**
 * Update the owners of the mappings
 * @param {DataNode} dataNode
 * @param {string} key
 * @param {Mapping} mapping
 */
function swapMapping(dataNode, key, mapping){
    dataNode[key] && dataNode[key]._removeOwner(dataNode);
    dataNode[key] = mapping;
    dataNode[key] && dataNode[key]._addOwner(dataNode);
}

module.exports = {
    Graph : Graph,
    InputNode: InputNode,
    DataNode: DataNode
};
