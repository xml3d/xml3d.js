(function() {

    var OpenCTMFormatHandler = function() {
        XML3D.base.BinaryFormatHandler.call(this);
    }
    XML3D.createClass(OpenCTMFormatHandler, XML3D.base.BinaryFormatHandler);

    OpenCTMFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        if (!(response instanceof ArrayBuffer))
            return false;

        var stream = new CTM.Stream(response);
        try {
            new CTM.FileHeader(stream);
        } catch (e) {
            return false; // not a OpenCTM stream
        }
        return true;
    }

    OpenCTMFormatHandler.prototype.getFormatData = function(response, responseType, mimetype, callback) {
        try {
            var xflowDataNode = loadOpenCTM(response);
            callback(true, xflowDataNode);
        } catch (e) {
            XML3D.debug.logError("Failed to process OpenCTM file: " + e);
            callback(false);
        }

    }

    var openctmFormatHandler = new OpenCTMFormatHandler();
    XML3D.base.registerFormat(openctmFormatHandler);

    function createXflowBuffer(dataNode, name, type, size, key) {
        var inputNode = Xflow.createBufferInputNode(type, name, size);
        dataNode.appendChild(inputNode);
        return inputNode.data.getValue();
    }

    // OpenCTM

    function loadOpenCTM(data)
    {
        if (!data instanceof ArrayBuffer)
            throw new Error("ArrayBuffer required");

        var stream = new CTM.Stream(data);
        var header;
        try {
            header = new CTM.FileHeader(stream);
        } catch (e) {
            throw new Error("not a OpenCTM stream");
        }

        var indexSize = 3 * header.triangleCount;
        var normalSize = header.vertexCount;
        var positionSize = header.vertexCount;
        var texcoordSize = (header.uvMapCount > 0 ? header.vertexCount : 0);

        var node = XML3D.data.xflowGraph.createDataNode();

        var index = createXflowBuffer(node, 'index', 'int', indexSize);
        var normal = createXflowBuffer(node, 'normal', 'float3', normalSize);
        var position = createXflowBuffer(node, 'position', 'float3', positionSize);
        var texcoord = createXflowBuffer(node, 'texcoord', 'float2', texcoordSize);

        //stream.setPosition(0);
        stream = new CTM.Stream(data);
        var file = new CTM.File(stream);

        //if (file.header.hasNormals());

        for (var i = 0; i < file.body.indices.length; ++i) {
            index[i] = file.body.indices[i];
        }
        for (var i = 0; i < file.body.vertices.length; ++i) {
            position[i] = file.body.vertices[i];
        }

        if (file.body.normals) {
            for (var i = 0; i < file.body.normals.length; ++i) {
                normal[i] = file.body.normals[i];
            }
        } else {
            for (var i = 0; i < normal.length / 3; ++i) {
                normal[i * 3 + 0] = 1;
                normal[i * 3 + 1] = 0;
                normal[i * 3 + 2] = 0;
            }
        }
        if (file.body.uvMaps) {
            var uvMap = file.body.uvMaps[0];
            for (var i = 0; i < uvMap.uv.length; ++i) {
                texcoord[i] = uvMap.uv[i];
            }
        }

        return node;
    }

    /**
     * @implements IDataAdapter
     */
    var OpenCTMDataAdapter = function(xflowNode) {
        this.xflowDataNode = xflowNode;
    }

    OpenCTMDataAdapter.prototype.getXflowNode = function() {
        return this.xflowDataNode;
    }

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var OpenCTMFactory = function(){
        XML3D.base.AdapterFactory.call(this, XML3D.data);
    };
    XML3D.createClass(OpenCTMFactory, XML3D.base.AdapterFactory);

    OpenCTMFactory.prototype.aspect = XML3D.data;
    OpenCTMFactory.prototype.createAdapter = function(data) {
        return new OpenCTMDataAdapter(data);
    }

    XML3D.base.resourceManager.addBinaryExtension('.ctm');
    openctmFormatHandler.registerFactoryClass(OpenCTMFactory);

}());
