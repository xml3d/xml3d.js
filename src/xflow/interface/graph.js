var C = require("./constants");
var Mapping = require("./mapping");

var Base = require("../base.js");
var ChannelNode = require("../processing/channel-node").ChannelNode;
var Utils = require("../utils/utils.js");

//----------------------------------------------------------------------------------------------------------------------
// GraphNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * Base class for other graph nodes
 * @constructor
 * @abstract
 * @param {Graph} graph Reference to parent graph
 */
var GraphNode = function(){
    /**
     * All nodes that add a dependency to this node
     * @type array<GraphNode>
     **/
    this._parents = [];
};


//----------------------------------------------------------------------------------------------------------------------
// InputNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * An InputNode include an DataEntry, a name and other information
 * This class mirrors XML3D elements such as <float3>, <int> or <texture>
 *
 * @constructor
 * @param {Graph} graph
 * @extends {GraphNode}
 */
var InputNode = function(){
    GraphNode.call(this);
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
     * @type {DataEntry}
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
Base.createClass(InputNode, GraphNode);

/**
 * Propagate events from DataEntry to parent nodes
 * @param {Object} newValue
 * @param {C.DATA_ENTRY_STATE} notification
 */
InputNode.prototype.onDataChange = function(newValue, notification) {
    var downNote;
    switch(notification){
        case C.DATA_ENTRY_STATE.CHANGED_VALUE: downNote = C.RESULT_STATE.CHANGED_DATA_VALUE; break;
        case C.DATA_ENTRY_STATE.LOAD_START: downNote = C.RESULT_STATE.IMAGE_LOAD_START; break;
        case C.DATA_ENTRY_STATE.LOAD_END: downNote = C.RESULT_STATE.IMAGE_LOAD_END; break;
        case C.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE: downNote = C.RESULT_STATE.CHANGED_STRUCTURE; break;
        case C.DATA_ENTRY_STATE.CHANGED_SIZE: downNote = C.RESULT_STATE.CHANGED_DATA_SIZE; break;
        default: downNote = C.RESULT_STATE.CHANGED_DATA_SIZE; break;
    }
    notifyParentsOnChanged(this,downNote);
};

Object.defineProperty(InputNode.prototype, "name", {
    /** @param {string} v */
    set: function(v){
        this._name = v;
        notifyParentsOnChanged(this, C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._name; }
});

Object.defineProperty(InputNode.prototype, "key", {
    /** @param {number} v */
    set: function(v){
        this._key = v;
        notifyParentsOnChanged(this, C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {number} */
    get: function(){ return this._key; }
});

Object.defineProperty(InputNode.prototype, "paramName", {
    /** @param {string} v */
    set: function(v){
        this._paramName = v;
        notifyParentsOnChanged(this, C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._paramName; }
});

Object.defineProperty(InputNode.prototype, "paramGlobal", {
    /** @param {boolean} v */
    set: function(v){
        this._paramGlobal = v;
        notifyParentsOnChanged(this, C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
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
        if(this._data) {
            this._data.addListener(this._dataListener);
        }
        if(prevDataLoading != this._data._loading){
            notifyParentsOnChanged(this, this._data._loading ? C.RESULT_STATE.IMAGE_LOAD_START :
                C.RESULT_STATE.IMAGE_LOAD_END);
        }
        Base._flushResultCallbacks();
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
// DataNode
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
var DataNode = function(isDataFlow){
    GraphNode.call(this);

    /**
     * Marker, if this data node is expecting data. Xflow
     * is not monitoring any load events. This must be set
     * from external
     * @type {boolean}
     */
    this._loading = false;

    /**
     * Experimental! Priority. How important is this data?
     * 0: Very important
     * @type {number}
     */
    this._loadLevel = 0;

    /**
     * Used for loading events: If progress level
     * reaches infinity, loading events are triggered
     * @type {Number}
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
     */
    this._children = [];

    /**
     * The DataNode that has been reference via src
     * @type {DataNode}
     */
    this._sourceNode = null;

    /**
     * Field to attach custom data
     * @type {null|Object}
     */
    this._userData = null;

    /**
     * The filter type of this node (keep, rename, remove ...)
     * @type {DATA_FILTER_TYPE}
     */
    this._filterType = C.DATA_FILTER_TYPE.NONE;

    /**
     * Define the mapping
     * @type {Mapping.Mapping}
     */
    this._filterMapping = null;

    /**
     * String identifier for operator
     * TODO: Operator class
     * @type {string|Object}
     */
    this._computeOperator = "";

    /**
     * True, if compute is a dataflow reference
     * @type {boolean}
     */
    this._computeUsesDataflow = false;

    /**
     * Mapping for input of operator,
     * e.g. (position, texcoord) or ({position: pos, texcoord: uv})
     * @type {Mapping}
     */
    this._computeInputMapping = null;

    /**
     * Mapping for output of operator,
     * e.g. (position, texcoord) = ... or {position: pos, texcoord: uv} = ...
     * @type {Mapping}
     */
    this._computeOutputMapping = null;

    /**
     * If dataflow node has been resolved, this
     * entry is set
     * @type {DataNode}
     */
    this._dataflowNode = null;

    /**
     * Internal (optimized) version of this data node
     * @type {ChannelNode}
     */
    this._channelNode = new ChannelNode(this);

    /**
     * Map of cached channel nodes for dataflow instances with varying
     * input arguments (specialized nodes)
     * TODO: Use WeakMap?
     * @type {Object.<string, ChannelNode>}
     */
    this._substitutionNodes = {};

    /**
     * Cached version of local param names collected from
     * children
     * @type {Array.<string>}
     */
    this._paramNames = null;

    /**
     * Cached version of global param names collected from
     * children
     * @type {Array.<string>}
     */
    this._globalParamNames = null;

    /**
     * Platform, this data node should be executed on
     * TODO: This should be implicit, not explicit
     * @type {null}
     */
    this._platform = null;

    /**
     * Observers of the node's C.RESULT_STATE
     * @type {Array}
     */
    this._listeners = [];

    /**
     * Observers of the node's progress level
     * @type {Array}
     */
    this._loadListeners = [];

};
Base.createClass(DataNode, GraphNode);


Object.defineProperty(DataNode.prototype, "sourceNode", {
    /** @param {?DataNode} newSourceNode */
    set: function(newSourceNode){
        replaceNodeInHierarchy(this, "_sourceNode", newSourceNode);
        updateProgressLevel(this);
        this.notify(C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {?DataNode} */
    get: function(){ return this._sourceNode; }
});

Object.defineProperty(DataNode.prototype, "dataflowNode", {
    /** @param {?DataNode} newDataflowNode */
    set: function(newDataflowNode){
        if(newDataflowNode && !this._computeUsesDataflow) {
            throw new Error("Cannot set dataflowNode when compute doesn't use dataflow.");
        }
        replaceNodeInHierarchy(this, "_dataflowNode", newDataflowNode);
        updateProgressLevel(this);
        this.notify(C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
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
        updateProgressLevel(this);
        Base._flushResultCallbacks();
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
    /** @param {C.DATA_FILTER_TYPE} v */
    set: function(v){
        this._filterType = v;
        this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {C.DATA_FILTER_TYPE} */
    get: function(){ return this._filterType; }
});

Object.defineProperty(DataNode.prototype, "filterMapping", {
    /** @param {Mapping} v */
    set: function(v){
        swapMapping(this, "_filterMapping", v);
        this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {Mapping} */
    get: function(){ return this._filterMapping; }
});

Object.defineProperty(DataNode.prototype, "computeOperator", {
    /** @param {string} v */
    set: function(v){
        this._computeOperator = v;
        this._computeUsesDataflow = false;
        this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._computeUsesDataflow ? null : this._computeOperator; }
});

Object.defineProperty(DataNode.prototype, "computeDataflowUrl", {
    /** @param {string} v */
    set: function(v){
        this._computeOperator = v;
        this._computeUsesDataflow = true;
        this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {string} */
    get: function(){ return this._computeUsesDataflow ? this._computeOperator : null; }
});

Object.defineProperty(DataNode.prototype, "computeInputMapping", {
    /** @param {Mapping} v */
    set: function(v){
        swapMapping(this, "_computeInputMapping", v);
        this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {Mapping} */
    get: function(){ return this._computeInputMapping; }
});
Object.defineProperty(DataNode.prototype, "computeOutputMapping", {
    /** @param {Mapping} v */
    set: function(v){
        swapMapping(this, "_computeOutputMapping", v);
        this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
        Base._flushResultCallbacks();
    },
    /** @return {Mapping} */
    get: function(){ return this._computeOutputMapping; }
});

//noinspection JSUnusedGlobalSymbols
DataNode.prototype.isProtoNode = function(){
    return this._isProtoNode;
};

/**
 * @param {GraphNode} child
 */
DataNode.prototype.appendChild = function(child){
    this._children.push(child);
    addParent(this, child);
    updateProgressLevel(this);
    this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
};
/**
 * @param {GraphNode} child
 */
DataNode.prototype.removeChild = function(child){
    Array.erase(this._children, child);
    removeParent(this, child);
    updateProgressLevel(this);
    this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
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
    updateProgressLevel(this);
    this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
};

/**
 * remove all children of the DataNode
 */
DataNode.prototype.clearChildren = function(){
    for(var i =0; i < this._children.length; ++i){
        removeParent(this, this._children[i]);
    }
    this._children = [];
    updateProgressLevel(this);
    this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
};

//noinspection JSUnusedGlobalSymbols
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
 * @param {String|C.PLATFORM|null} platformSrc
 */
DataNode.prototype.setPlatform = function(platformSrc) {
    if (typeof platformSrc === 'string') {
        if (platformSrc === "cl") {
            this._platform = C.PLATFORM.CL;
        }
        else if (platformSrc === "gl") {
            this._platform = C.PLATFORM.GLSL;
        }
        else if (platformSrc === "js") {
            this._platform = C.PLATFORM.JAVASCRIPT;
        }
    } else if (!isNaN(parseFloat(platformSrc)) && isFinite(platformSrc)) {
        this._platform = platformSrc;
    } else {
        this._platform = null;
    }

    this.notify(C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
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
    var newType = C.DATA_FILTER_TYPE.RENAME;
    var newMapping = null;
    if(filterString){
        var result = filterString.trim().match(filterParser);
        if(result){
            var type = result[1].trim();
            switch(type){
                case "keep": newType = C.DATA_FILTER_TYPE.KEEP; break;
                case "remove": newType = C.DATA_FILTER_TYPE.REMOVE; break;
                case "rename": newType = C.DATA_FILTER_TYPE.RENAME; break;
                default:
                    Base.notifyError("Unknown filter type:" + type, this);
            }
            newMapping = Mapping.Mapping.parse(result[2], this);
        }
        else{
            Base.notifyError("Could not parse filter '" + filterString + "'", this);
        }
    }
    if(!newMapping){
        // TODO Remove this? (Mapping can be null from now on)
        newMapping = new Mapping.OrderMapping();
    }
    swapMapping(this, "_filterMapping", newMapping);
    this._filterType = newType;
    this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
};

var computeParser = /^(([^=]+)\=)?([^'(]+('[^']+')?[^'(]+)(\(([^()]*)?\))?$/;
var bracketsParser = /^\(([^()]*)\)$/;
var dataflowParser = /^dataflow\['([^']+)'\]$/;

//noinspection JSUnusedGlobalSymbols
/**
 * If the compute string contains a reference to an external dataflow,
 * the parser returns its URL. Null, otherwise
 * @param computeString
 * @returns {string|null}
 */
var getComputeDataflowUrl = function(computeString){
    computeString = computeString || "";
    var result = computeString.trim().match(computeParser);
    if(result){
        if(result = result[3].trim().match(dataflowParser)){
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
            inputMapping = Mapping.Mapping.parse(input, this);
        if(output)
            outputMapping = Mapping.Mapping.parse(output, this);

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
        Base.notifyError("Error parsing Compute value '" + computeString + "'", this);
    }
    swapMapping(this, "_computeInputMapping", inputMapping);
    swapMapping(this, "_computeOutputMapping", outputMapping);
    this._computeOperator = newOperator;
    this.notify( C.RESULT_STATE.CHANGED_STRUCTURE);
    Base._flushResultCallbacks();
};

/**
 * Notifies DataNode about a change. Notification will be forwarded to parents, if necessary
 * @param {C.RESULT_STATE} changeType
 * @param {GraphNode?} senderNode
 */
DataNode.prototype.notify = function(changeType, senderNode){
    //noinspection FallthroughInSwitchStatementJS
    switch(changeType) {
        case C.RESULT_STATE.CHANGED_STRUCTURE:
            this._paramNames = null;
            this._globalParamNames = null;
            this._channelNode.setStructureOutOfSync();
            clearSubstitutionNodes(this);
            notifyParentsOnChanged(this, changeType);
            break;

        case C.RESULT_STATE.IMAGE_LOAD_START:
        case C.RESULT_STATE.IMAGE_LOAD_END:
            updateProgressLevel(this);
            if(senderNode){
                this._channelNode.notifyDataChange(senderNode, changeType);
            }
            break;

        case C.RESULT_STATE.CHANGED_DATA_VALUE:
        case C.RESULT_STATE.CHANGED_DATA_SIZE:
            if(senderNode){
                this._channelNode.notifyDataChange(senderNode, changeType);
            }
            break;
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

//noinspection JSUnusedGlobalSymbols
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

//noinspection JSUnusedGlobalSymbols
DataNode.prototype.getParamNames = function(){
    return this._getParamNames();
};

/**
 * Delegate computation of the result to the channel node
 * of the first contributing DataNode.
 * @param type
 * @param filter
 * @returns {Result}
 */
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
            Utils.nameset.add(this._paramNames, this._sourceNode._getParamNames());
        else{
            for(var i = 0; i < this._children.length; ++i){
                Utils.nameset.add(this._paramNames, this._children[i]._getParamNames());
            }
        }
    }
    return this._paramNames;
};

DataNode.prototype._getGlobalParamNames = function(){
    if(!this._globalParamNames){
        this._globalParamNames = [];
        if(this._dataflowNode)
            Utils.nameset.add(this._globalParamNames, this._dataflowNode._getGlobalParamNames());

        if(this._sourceNode)
            Utils.nameset.add(this._globalParamNames, this._sourceNode._getGlobalParamNames());
        else{
            for(var i = 0; i < this._children.length; ++i){
                Utils.nameset.add(this._globalParamNames, this._children[i]._getGlobalParamNames());
            }
        }
    }
    return this._globalParamNames;
};

/**
 * @param {Substitution} substitution
 * @returns {ChannelNode}
 */
DataNode.prototype._getOrCreateChannelNode = function(substitution){
    if(!substitution)
        return this._channelNode;
    else{
        var key = substitution.getKey(this);
        if(!this._substitutionNodes[key]) {
            this._substitutionNodes[key] = new ChannelNode(this, substitution);
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
    var hasFilter = (dataNode._filterMapping && !dataNode._filterMapping.isEmpty());
    if(hasFilter)
        return dataNode;

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
    return dataNode;
}


/**
 * Computes the progress level
 * @private
 * @param {DataNode} node
 */
function updateProgressLevel(node){
    var progressLevel = node._loading ? node._loadLevel : Infinity;
    var i;

    for(i = 0; progressLevel && i < node._children.length; ++i){
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
        for(i = 0; i < node._parents.length; ++i)
            updateProgressLevel(node._parents[i]);
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
 * @param {exports.C.RESULT_STATE} changeType
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

function replaceNodeInHierarchy(node, field, newChild) {
    var oldChild = node[field];
    if(oldChild) {
        removeParent(node, oldChild);
    }
    node[field] = newChild;
    if(newChild) {
        addParent(node, newChild);
    }
}

module.exports = {
    InputNode: InputNode,
    DataNode: DataNode,
    getComputeDataflowUrl: getComputeDataflowUrl
};
