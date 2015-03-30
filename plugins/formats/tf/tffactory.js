/* Transfer function loader
 loads the data from text file, which contains color table
 creates 1d texture for transfer function which is used for volume rendering
 */
(function () {
    "use strict";

    var TFFormatHandler = function () {
        XML3D.resource.FormatHandler.call(this);
    };

    XML3D.createClass(TFFormatHandler, XML3D.resource.FormatHandler);

    TFFormatHandler.prototype.isFormatSupported = function (response /* responseType, mimetype */) {
        var fileFormat = "";

        if (typeof(response) == "string")
            fileFormat = response.substring(0, 4); else {
            var stream = new Uint8Array(response);
            for (var i = 0; i < 4; i++)
                fileFormat += String.fromCharCode(stream[i]);
        }

        return fileFormat.toLowerCase() == "1dtf";
    };

    var tfFormatHandler = new TFFormatHandler();
    XML3D.resource.registerFormat(tfFormatHandler);

    function createTextureEntry(image) {
        var entry = new Xflow.TextureEntry(image);
        var config = entry.getSamplerConfig();
        config.wrapS = WebGLRenderingContext.CLAMP_TO_EDGE;
        config.wrapT = WebGLRenderingContext.CLAMP_TO_EDGE;
        config.minFilter = WebGLRenderingContext.LINEAR;
        config.magFilter = WebGLRenderingContext.LINEAR;
        config.textureType = Xflow.TEX_TYPE.TEXTURE_2D;
        return entry;
    }

    function createXflowTexture(dataNode, name, image) {
        var texEntry = createTextureEntry(image);

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = texEntry;
        inputNode.name = name;
        dataNode.appendChild(inputNode);
        return inputNode.data;
    }

    TFFormatHandler.prototype.loadTF = function (data) {

        if (data instanceof ArrayBuffer) {
            var stream = new Uint8Array(data);
            data = "";

            for (var i = 0; i < stream.length; i++)
                data += String.fromCharCode(stream[i]);
        }

        var node = new Xflow.DataNode();

        var lines = data.split('\n');
        var tfWidth = Number(lines[1].trim());

        var newCanvas = document.createElement("canvas");
        newCanvas.width = tfWidth;
        newCanvas.height = 1;

        var context = newCanvas.getContext("2d");
        var tfData = context.createImageData(tfWidth, 1);

        data = tfData.data;

        var iline = 2;
        var lineData;
        var k = 0;
        var maxLine = Math.min(iline + tfWidth, lines.length);

        while (iline < maxLine) {
            lineData = lines[iline].trim().split(" ");
            data[k++] = lineData[0];
            data[k++] = lineData[1];
            data[k++] = lineData[2];
            data[k++] = lineData[3];
            iline++;
        }

        context.putImageData(tfData, 0, 0);
        createXflowTexture(node, "transferFunction", newCanvas);

        return node;
    };


    // Export
    // XML3D.base.TFFormatHandler = TFFormatHandler;

    /**
     * @constructor
     */
    var TFDataAdapter = function (tfData) {
        try {
            this.xflowDataNode = TFFormatHandler.prototype.loadTF(tfData);
        } catch (e) {
            XML3D.debug.logError("Failed to process TF file: " + e);
        }
    };

    TFDataAdapter.prototype.getXflowNode = function () {
        return this.xflowDataNode;
    };

    /**
     * @constructor
     * @extends AdapterFactory
     * @implements IFactory
     */
    var TFFactory = function () {
        XML3D.resource.AdapterFactory.call(this, "data");
    };
    XML3D.createClass(TFFactory, XML3D.resource.AdapterFactory);

    TFFactory.prototype.aspect = XML3D.data;
    TFFactory.prototype.createAdapter = function (data) {
        return new TFDataAdapter(data);
    };

    tfFormatHandler.registerFactoryClass(TFFactory);

}());
