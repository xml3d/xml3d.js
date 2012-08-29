/**
 * Created by JetBrains PhpStorm.
 * User: lachsen
 * Date: 29.08.12
 * Time: 10:19
 * To change this template use File | Settings | File Templates.
 */
(function(){

/**
 * @constructor
 */
var Graph = function(){
    this.nodes = [];
};
Xflow.Graph = Graph;

/**
 * @return {Xflow.InputNode}
 */
Graph.prototype.createInputNode = function(){
    var node = new Xflow.InputNode(this);
    this.nodes.push(node);
    return node;
};

/**
 * @return {Xflow.DataNode}
 */
Graph.prototype.createDataNode = function(){
    var node = new Xflow.DataNode(this);
    this.nodes.push(node);
    return node;
};

/**
 * @constructor
 */
var GraphNode = function(graph){
    this._graph = graph;
};
Xflow.GraphNode = GraphNode;

/**
 * @constructore
 * @param {Xflow.Graph} graph
 * @extends {Xflow.GraphNode}
 */
var InputNode = function(graph){
    Xflow.GraphNode.call(this, graph);
    this._name = "";
    this._seqnr = 0;
    this._data = null;
    this._param = false;

    this._parents = [];
};
XML3D.createClass(InputNode, Xflow.GraphNode);
Xflow.InputNode = InputNode;

Object.defineProperty(InputNode.prototype, "name", {
    set: function(v){
        this._name = v;
        notifyParentsOnChanged(this, XflowModification.STRUCTURE_CHANGED);
    },
    get: function(){ return this._name; }
});
Object.defineProperty(InputNode.prototype, "seqnr", {
    set: function(v){
        this._seqnr = v;
        notifyParentsOnChanged(this, XflowModification.STRUCTURE_CHANGED);
    },
    get: function(){ return this._seqnr; }
});
Object.defineProperty(InputNode.prototype, "param", {
    set: function(v){
        this._param = v;
        notifyParentsOnChanged(this, XflowModification.STRUCTURE_CHANGED);
    },
    get: function(){ return this._param; }
});
Object.defineProperty(InputNode.prototype, "data", {
    set: function(v){
        this._data = v;
        notifyParentsOnChanged(this, XflowModification.DATA_CHANGED, this._name);
    },
    get: function(){ return this._data; }
});



/**
 * @constructore
 * @extends {Xflow.GraphNode}
 */
var DataNode = function(graph){
    Xflow.GraphNode.call(this, graph);
    this._prototype = false;
    this._children = [];
    this._sourceNode = null;
    this._protoNode = null;

    this._filterType = 0;
    this._filterMapping = new Xflow.OrderMapping(this);

    this._computeOperator = "";
    this._computeInputMapping = new Xflow.OrderMapping(this);
    this._computeOutputMapping = new Xflow.OrderMapping(this);

    this._parents = [];

    this._state = XflowModification.NONE;
};
XML3D.createClass(DataNode, Xflow.DataNode);
Xflow.DataNode = DataNode;


DataNode.FILTER_TYPE = {
    KEEP: 0,
    REMOVE: 1,
    RENAME: 2
}

function addParent(parent, child){
    child._parents.push(parent);
}
function removeParent(parent, child){
    Array.erase(child._parents, parent);
}

Object.defineProperty(DataNode.prototype, "prototype", {
    set: function(v){ this._prototype = v;
    },
    get: function(){ return this._prototype; }
});
Object.defineProperty(DataNode.prototype, "sourceNode", {
    set: function(v){
        if(this._sourceNode) removeParent(this, this._sourceNode);
        this._sourceNode = v;
        if(this._sourceNode) addParent(this, this._sourceNode);
    },
    get: function(){ return this._sourceNode; }
});
Object.defineProperty(DataNode.prototype, "protoNode", {
    set: function(v){
        if(this._protoNode) removeParent(this, this._protoNode);
        this._protoNode = v;
        if(this._protoNode) addParent(this, this._protoNode);
        this.notify(XflowModification.STRUCTURE_CHANGED);
    },
    get: function(){ return this._protoNode; }
});

Object.defineProperty(DataNode.prototype, "filterType", {
    set: function(v){
        this._filterType = v;
        this.notify( XflowModification.STRUCTURE_CHANGED);
    },
    get: function(){ return this._filterType; }
});

Object.defineProperty(DataNode.prototype, "filterMapping", {
    set: function(v){ throw "filterMapping is readonly!";
    },
    get: function(){ return this._filterMapping; }
});

Object.defineProperty(DataNode.prototype, "computeOperator", {
    set: function(v){
        this._computeOperator = v;
        this.notify( XflowModification.STRUCTURE_CHANGED);
    },
    get: function(){ return this._computeOperator; }
});
Object.defineProperty(DataNode.prototype, "computeInputMapping", {
    set: function(v){ throw "computeInputMapping is readonly!";
    },
    get: function(){ return this._computeInputMapping; }
});
Object.defineProperty(DataNode.prototype, "computeOutputMapping", {
    set: function(v){ throw "computeOutputMapping is readonly!";
    },
    get: function(){ return this._computeOutputMapping; }
});

DataNode.prototype.appendChild = function(child){
    this._children.push(child);
    addParent(this, child)
    this.notify( XflowModification.STRUCTURE_CHANGED);
}

DataNode.prototype.removeChild = function(child){
    Array.erase(this._children, child);
    removeParent(this, child)
    this.notify( XflowModification.STRUCTURE_CHANGED);
}

DataNode.prototype.insertBefore = function(child, beforeNode){
    var idx = this._children.indexOf(beforeNode);
    if(idx == -1)
        this._children.push(child);
    else
        this._children.splice(idx, 0, child);
    addParent(this, child)
    this.notify( XflowModification.STRUCTURE_CHANGED);
}

DataNode.prototype.clearChildren = function(){
    for(var i =0; i < this._children.length; ++i){
        removeParent(this, this._children[i]);
    }
    this._children = [];
    this.notify( XflowModification.STRUCTURE_CHANGED);
}

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
}


var filterParser = /^([A-Za-z]*)\(([^()]+)\)$/;

/**
 * Set filter by string
 * @param {string} filterString
 */
DataNode.prototype.setFilter = function(filterString){
    var newType = DataNode.FILTER_TYPE.RENAME;
    var newMapping = null;
    var result = filterString.trim().match(filterParser);
    if(result){
        var type = ""+result[1];
        switch(type){
            case "keep": newType = DataNode.FILTER_TYPE.KEEP; break;
            case "remove": newType = DataNode.FILTER_TYPE.REMOVE; break;
            case "rename": newType = DataNode.FILTER_TYPE.RENAME; break;
        }
        newMapping = Xflow.Mapping.parse(result[2], this);
    }
    if(!newMapping){
        newMapping = new Xflow.OrderMapping(this);
    }
    removeMappingOwner(this._filterMapping);
    this._filterMapping = newMapping;
    this.notify( XflowModification.STRUCTURE_CHANGED);
};

var computeParser = /^(([^=]+)\=)?([^(]+)\(([^()]*)\)$/;
var bracketsParser = /^\(([^()]*)\)$/;

/**
 * Set compute by string
 * @param {string} computeString
 */
DataNode.prototype.setCompute = function(computeString){
    var newOperator = "";
    var inputMapping = null, outputMapping = null;
    var result = computeString.trim().match(computeParser);
    if(result){
        var output = result[2].trim();
        newOperator = result[3];
        var input = result[4].trim();
        if(result = output.match(bracketsParser)){
            output = result[1];
        }
        inputMapping = Xflow.Mapping.parse(input);
        outputMapping = Xflow.Mapping.parse(output);
    }
    if(!inputMapping) inputMapping = new Xflow.OrderMapping(this);
    if(!outputMapping) outputMapping = new Xflow.OrderMapping(this);
    removeMappingOwner(this._computeInputMapping);
    removeMappingOwner(this._computeOutputMapping);
    this._computeInputMapping = inputMapping;
    this._computeOutputMapping = outputMapping;
    this._computeOperator = newOperator;
    this.notify( XflowModification.STRUCTURE_CHANGED);
}

DataNode.prototype.notify = function(changeType, name){
    if(changeType == XflowModification.STRUCTURE_CHANGED && this._state != changeType)
    {
        this._state = changeType;
        notifyParentsOnChanged(this, changeType, name);
    }
    else if(changeType == XflowModification.DATA_CHANGED && this._state <= changeType){
        this._state = changeType;
        if(this._state < changeType){
            notifyParentsOnChanged(this, changeType, name);
        }

    }
};

function notifyParentsOnChanged(node, changeType, name){
    for(var i = 0; i < node._parents.length; ++i){
        node._parents[i].notify(changeType, name);
    }
};

function removeMappingOwner(mapping){
    if(mapping)
        mapping._owner = null;
};


})();