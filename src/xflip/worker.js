
var c_nodes = [];
var c_sinknodes = [];
var c_domid_nodes = {};
var c_graph = new Xflow.Graph();
var c_unresolved = [];

function error(msg){
    throw new Error(msg);
}
function log(msg){
    self.postMessage({type: "log", msg: msg});
}


self.onmessage = function(event) {
    var data = event.data;
    var type = data['type'];
    log("MESSAGE RECEIVED: " + type);
    switch(type){
        case "initialize":
            initialize(data['root'], data['addons'])
            break;
        case "createNode":
            createNode(data.nodeData);
            break
        case "connectNodes":
            connectNodes(data.parent, data.child);
            break;
        case "imageLoaded":
            imageLoaded(data.id, data.imageData);
            break;
        case "updateValue":
            updateValue(data.id, data.value);
            break;
        case "updateAttribute":
            updateAttribute(data.id, data.attrName, data.attrValue);
    }
    log("MESSAGE DONE: " + type);
}

window.setInterval(function(){
    for(var i = 0; i < c_sinknodes.length; ++i){
        var sinknode = c_sinknodes[i];
        if(sinknode.invalid){
            var result = sinknode.getResult();
            self.postMessage({ type: "updateSinkImage",
                id: sinknode.id,
                imageData: result && result.getValue()})
        }
    }
}, 10);



var c_data_attr = {
    'src' : { dest: 'sourceNode', type: "uri" },
    'proto' : { dest: 'protoNode', type: "uri" },
    'filter' : { dest: 'setFilter', type: "function" },
    'compute' : { dest: 'setCompute', type: "function" }
};
var c_input_attr = {
    'name' : {dest: 'name', type: "string" },
    'key' : {dest: 'key' , type: "float"},
    'param' : {dest: 'param' , type: "boolean"}
};

var c_parseConfig = {
    'xflowip' : { attr: c_data_attr, type : 'DataNode' },
    'xflowimg' : { attr: c_data_attr, type : 'SinkNode' },
    'data' : { attr: c_data_attr, type : 'DataNode' },
    'proto' : { attr: c_data_attr, type : 'ProtoNode' },
    'float' : { attr: c_input_attr, type: "InputNode", value: 'float' },
    'float2' : { attr: c_input_attr, type: "InputNode", value: 'float2' },
    'float3' : { attr: c_input_attr, type: "InputNode", value: 'float3' },
    'float4' : { attr: c_input_attr, type: "InputNode", value: 'float4' },
    'float4x4' : { attr: c_input_attr, type: "InputNode", value: 'float4' },
    'int' : { attr: c_input_attr, type: "InputNode", value: 'int' },
    'int4' : { attr: c_input_attr, type: "InputNode", value: 'int4' },
    'bool' : { attr: c_input_attr, type: "InputNode", value: 'bool'},
    'texture' : { attr: c_input_attr, type: "InputNode", value: 'texture'},
    'img' : { type: "Image"}
}

function initialize(root, addons){
    var relativeAddons = [];
    root = root.replace(/[^/]*$/,"");
    for(var i =0; i < addons.length; ++i){
        var url = addons[i];
        if(url.indexOf("http://") == -1){
            if(url.charAt[0] == "/"){
                url = root.replace(/\/.*$/, "") + url;
            }
            else{
                url = root + url;
            }
        }
        relativeAddons[i] = url;
    }
    importScripts.apply(null, relativeAddons);
    self.postMessage({"type": "initialized"});
}

function createNode(data){
    var id = data.id;
    var entry = c_parseConfig[data.tagName];
    if(!entry){
        error("Unsupported tagName '" + data.tagName + "'");
        return;
    }

    var node;

    var type = entry.type;
    switch(type){
        case "DataNode":
        case "ProtoNode": node = initDataNode(id, entry, data); break;
        case "SinkNode":  node = initSinkNode(id, entry, data); break;
        case "InputNode": node = initInputNode(id, entry, data); break;
        case "Image":     node = initImageNode(id, entry, data); break;
        default: error("Unknown Node Type: " + type);
    }

    c_nodes[id] = node;

    if(data.attribs['id']){
        c_domid_nodes[data.attribs['id']] = node;
    }

    setNodeAttributes(node, entry, data);
}


function connectNodes(parentId, childId){
    var parent = c_nodes[parentId], child = c_nodes[childId];
    if(!parent) return error("addChild: Parent not found");
    if(!child) return error("addChild: Child not found");

    if(parent.xflow instanceof Xflow.DataNode && child.xflow instanceof Xflow.GraphNode){
        parent.xflow.appendChild(child.xflow);
    }
    else if(parent instanceof InputNode && child instanceof ImageNode){
        child.parent = parent.xflow;
        if(child.imageData)
            parent.xflow.data.setImageData(child.imageData);
    }
}

function updateValue(id, value){
    var node = c_nodes[id];
    if(!node) return;
    var entry = node.entry;
    if(entry.value){
        var dataEntry = createDataEntry(entry.value, value);
        node.xflow.data = dataEntry;
    }
}

function updateAttribute(id, attrName, attrValue){
    var node = c_nodes[id];
    if(!node) return;
    var entry = node.entry;
    if(entry.attr[attrName]){
        setNodeAttribute(node, entry, attrName, attrValue);
    }
}

function imageLoaded(nodeId, imageData){
    var node = c_nodes[nodeId];
    if(!node) return error("imageLoaded: Node not found");
    node.imageData = imageData;
    if(node.parent){
        node.parent.data.setImageData(imageData);
    }
}


function initDataNode(id, entry, data){
    var xflowNode = c_graph.createDataNode(entry.type == "ProtoNode");
    var node = new DataNode(id, entry, xflowNode);
    return node;
}

function initInputNode(id, entry, data){
    var xflowNode = c_graph.createInputNode();
    var dataEntry = createDataEntry(entry.value, data.value )
    xflowNode.data = dataEntry;

    var node = new InputNode(id, entry, xflowNode);
    return node;
}

function initSinkNode(id, entry, data){
    var xflowNode = c_graph.createDataNode(false);
    var sourceName = data.attribs["srcname"];
    if(!sourceName)
        error("No 'srcname' attribute provided for xflowimg node");

    var node = new SinkNode(id, entry, sourceName, xflowNode);
    return node;
}

function createDataEntry(type, data){
    var entry;
    if(type == "texture"){
        entry = new Xflow.ImageDataTextureEntry();
    }
    else{
        var buffer = createBuffer(type,data);
        entry = new Xflow.BufferEntry(Xflow.DATA_TYPE_MAP[type], buffer);
    }
    return entry;
}

function createBuffer(type, data){
    switch(type){
        case "float":
        case "float2":
        case "float3":
        case "float4":
        case "float4x4":
            var m = data.match(c_FloatParseReg);
            return m ? new Float32Array(m) : new Float32Array();
        case "int":
        case "int4":
            var m = data.match(c_IntParseReg);
            return m ? new Int32Array(m) : new Int32Array();
        case "bool":
            var m = data.match(c_BoolParseReg);
            return m ? new Uint8Array(Array.map(m, string2Bool)) : new Uint8Array();
        default: error("Unsupported BufferType: " + type);
            return null;
    }
}

var c_FloatParseReg =/([+\-0-9eE\.]+)/g;
var c_IntParseReg = /([+\-0-9]+)/g;
var c_BoolParseReg = /(true|false|0|1)/ig;
function string2Bool(string) {
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
}


function initImageNode(id, entry, data){
    var node = new ImageNode(id, entry);
    var src = data.attribs["src"];
    self.postMessage({type: 'loadImage', url: src, id: node.id });
    return node;
}

function setNodeAttributes(node, entry, data){
    if(entry.attr){
        for(var name in entry.attr){
            if(data.attribs[name] !== undefined){
                setNodeAttribute(node, entry, name, data.attribs[name]);
            }
        }
    }
}
function setNodeAttribute(node, entry, name, value){
    var attrInfo = entry.attr[name];
    switch(attrInfo.type){
        case "string":
            node.xflow[attrInfo.dest] = value; break;
        case "float":
            node.xflow[attrInfo.dest] = value*1; break;
        case "boolean":
            node.xflow[attrInfo.dest] = (value == "true"); break;
        case "function":
            node.xflow[attrInfo.dest](value); break;
        case "uri":
            var uri = value;
            if(!resolveURI(node, attrInfo.dest, uri))
                c_unresolved.push({node: node, dest: attrInfo.dest, uri: uri })
            break;
    }
}

function resolveURI(node, dest, uri){
    if(uri.charAt(0) != "#"){
        node.xflow[dest] = null;
        error("Currently only local references are supported. URI '" + uri + "' can't be resolved");
        return true;
    }

    var id = uri.substr(1);
    if(c_domid_nodes[id] && c_domid_nodes[id].xflow instanceof Xflow.DataNode){
        node.xflow[dest] = c_domid_nodes[id].xflow;
        return true;
    }
    return false;
}

function InputNode(id, entry, xflowInputNode){
    this.id = id;
    this.entry = entry;
    this.xflow = xflowInputNode;
};

function DataNode(id, entry, xflowDataNode){
    this.id = id;
    this.entry = entry;
    this.xflow = xflowDataNode;
};

function SinkNode(id, entry, source, xflowDataNode){
    this.id = id;
    this.entry = entry;
    this.xflow = xflowDataNode;
    this.source = source;
    this.invalid = true;
    this.request = new Xflow.ComputeRequest(this.xflow, [source], this.invalidate.bind(this));

    c_sinknodes.push(this);
};

SinkNode.prototype.invalidate = function(){
    self.postMessage({type: "modified", id: this.id});
    this.invalid = true;
}

SinkNode.prototype.getResult = function(){
    this.invalid = false;
    var result = this.request.getResult();
    return result.getOutputData(this.source);
}

function ImageNode(id, entry){
    this.id = id;
    this.entry = entry;
};
