(function() {

	var hasWebWorkerSupport = !!window.Worker;

    var OpenCTMFormatHandler = function() {
        XML3D.base.BinaryFormatHandler.call(this);
	    if (hasWebWorkerSupport) {
	        this.worker = new Worker("openctm-worker.js");
		    this.callbackMap = [];
		    this.worker.addEventListener("error", function (error) {
			    XML3D.debug.logError("[OpenCTMFormatHandler] Failed to process OpenCTM file: " + error);
			    if (error.id)
			        self.callbackMap[error.id](true, xflowDataNode);
		    });
		    var self = this;
		    this.worker.addEventListener("message", function (event) {
			    var message = event.data;
			    switch (message.type) {
				    case "file":
					    var xflowDataNode = createXflowDataNode(message);
					    self.callbackMap[message.id](true, xflowDataNode);
					    break;
				    default:
					    XML3D.debug.logError("[OpenCTMFormatHandler] Unrecognized message received: " + message.type);
					    self.callbackMap[message.id](false);
					    break;
			    }
		    })
	    }
    };

	XML3D.createClass(OpenCTMFormatHandler, XML3D.base.BinaryFormatHandler);

    OpenCTMFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
	    if (!(response instanceof ArrayBuffer))
	        return false;

	    var stream = new CTM.Stream(response);
	    try {
		    new CTM.FileHeader(stream);
	    } catch (e) {
		    return false;
	    }

	    return true;
    };

	function getFormatDataWebWorker(response, responseType, mimetype, callback) {
		var id = this.callbackMap.push(callback) - 1;
		this.worker.postMessage({
			type: "decodeFile",
			id: id,
			stream: response
		}, [response]);
	}

	function getFormatDataSynchronously(response, responseType, mimetype, callback) {
		try {
			var stream = new CTM.Stream(response);
			var file = new CTM.File(stream);
			var xflowDataNode = createXflowDataNode(file.body);
			callback(true, xflowDataNode);
		} catch (e) {
			XML3D.debug.logError("Failed to process OpenCTM file: " + e);
			callback(false);
		}
	}

	function createXflowDataNode (file) {
		var xflowDataNode = XML3D.data.xflowGraph.createDataNode();
		xflowDataNode.appendChild(createInputNode("index", "int", file.indices));
		xflowDataNode.appendChild(createInputNode("position", "float3", file.vertices));
		if (file.normals)
			xflowDataNode.appendChild(createInputNode("normal", "float3", file.normals));
		else
			xflowDataNode.appendChild(createInputNode("normal", "float3", CTM.calcSmoothNormals(file.indices, file.vertices)));

		if (file.uvMaps)
			xflowDataNode.appendChild(createInputNode("texcoord", "float2", file.uvMaps[0].uv));

		return xflowDataNode;
	}

	function createInputNode(name, type, typedArray) {
		var inputNode = XML3D.data.xflowGraph.createInputNode();
		inputNode.name = name;
		inputNode.data = new Xflow.BufferEntry(XML3D.data.BUFFER_TYPE_TABLE[type], typedArray);
		return inputNode;
	}

	if (hasWebWorkerSupport)
		OpenCTMFormatHandler.prototype.getFormatData = getFormatDataWebWorker;
	else
		OpenCTMFormatHandler.prototype.getFormatData = getFormatDataSynchronously;

	var openctmFormatHandler = new OpenCTMFormatHandler();
    XML3D.base.registerFormat(openctmFormatHandler);

    /**
     * @implements IDataAdapter
     */
    var OpenCTMDataAdapter = function (xflowNode) {
		this._xflowDataNode = xflowNode;
    };

    OpenCTMDataAdapter.prototype.getXflowNode = function() {
        return this._xflowDataNode;
    };

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var OpenCTMFactory = function(){
        XML3D.base.AdapterFactory.call(this, XML3D.data);
    };

    XML3D.createClass(OpenCTMFactory, XML3D.base.AdapterFactory);

    OpenCTMFactory.prototype.aspect = XML3D.data;
    OpenCTMFactory.prototype.createAdapter = function(xflowNode) {
        return new OpenCTMDataAdapter(xflowNode);
    };

    XML3D.base.resourceManager.addBinaryExtension('.ctm');
    openctmFormatHandler.registerFactoryClass(OpenCTMFactory);

}());
