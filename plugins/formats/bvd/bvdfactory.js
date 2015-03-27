/* Binary loader
	loads data for volumes from binary files
	data values may be stored as (1)byte or (2)ushort, loader will know which case takes place looking on byte #26, 
	if it is 1 - then case (1) one byte for every value, otherwise case (2) ushort - 2 bytes for every value
*/
(function() {
	"use strict";

	var headerSize = 50;
	var reservedHeaderSize = 25; // bytes are reserved in the beginning for some extra information about the data (owner, measuring method, etc.)
	
    var BVDFormatHandler = function() {
        XML3D.base.BinaryFormatHandler.call(this);
    };
	
    XML3D.createClass(BVDFormatHandler, XML3D.base.BinaryFormatHandler);

    BVDFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        if (!(response instanceof ArrayBuffer))
            return false;

		this.stream = new Uint8Array(response);
        var header;
        try {
            header = this.readFileHeader();
			return this.verifyFileSize(header);
        } catch (e) {
            return false; // not a BVD stream
        }
    };
	
	BVDFormatHandler.prototype.verifyFileSize = function(header) {
		var bytes = (header.bytesForValue == 1) ? 1 : 2;
		var mustSize = header.dimsX * header.dimsY * header.dimsZ * bytes + headerSize;
		if (this.stream.length == mustSize)
			return true;
		else
			return false;
	};
	
    BVDFormatHandler.prototype.readFileHeader = function() {
		var header = {};
		
		this.ipos = reservedHeaderSize;
		header.bytesForValue = this.readByte();
		
		header.dimsX = this.readUInt32();
		header.dimsY = this.readUInt32();
		header.dimsZ = this.readUInt32();
		
		header.sizeX = this.readFloat32();
		header.sizeY = this.readFloat32();
		header.sizeZ = this.readFloat32();
		
		return header;
	};
 
	BVDFormatHandler.prototype.readByte = function() {
		return this.stream[this.ipos++];
	};
	
	var TWO_POW_MINUS23 = Math.pow(2, -23);
	var TWO_POW_MINUS126 = Math.pow(2, -126);

	BVDFormatHandler.prototype.readFloat32 = function() {
	  var pb1 = this.readByte();
	  var pb2 = this.readByte();
	  var pb3 = this.readByte();
	  var pb4 = this.readByte();
	  
	  var m = pb1;
	  m += pb2 << 8;

	  var b1 = pb3;
	  var b2 = pb4;

	  m += (b1 & 0x7f) << 16;
	  var e = ( (b2 & 0x7f) << 1) | ( (b1 & 0x80) >>> 7);
	  var s = b2 & 0x80? -1: 1;

	  if (e === 255){
		return m !== 0? NaN: s * Infinity;
	  }
	  if (e > 0){
		return s * (1 + (m * TWO_POW_MINUS23) ) * Math.pow(2, e - 127);
	  }
	  if (m !== 0){
		return s * m * TWO_POW_MINUS126;
	  }
	  return s * 0;
	};

	BVDFormatHandler.prototype.readUInt32 = function() {
	  var b1 = this.readByte();
	  var b2 = this.readByte();
	  var b3 = this.readByte();
	  var b4 = this.readByte();
	  
	  b2 = b2 << 8;
	  b3 = b3 << 16;
	  b4 = b4 << 24;
	  return b1 | b2 | b3 | b4;
	};	
	
	BVDFormatHandler.prototype.readUInt16 = function() {
	  var b1 = this.readByte();
	  var b2 = this.readByte();
	  
	  b2 = b2 << 8;
	  return b1 | b2;
	};	
		
    var bvdFormatHandler = new BVDFormatHandler();
    XML3D.base.registerFormat(bvdFormatHandler);

    function createXflowBuffer(dataNode, name, type, size, key) {
        var inputNode = Xflow.createBufferInputNode(type, name, size);
        dataNode.appendChild(inputNode);
        return inputNode.data.getValue();
    };

    BVDFormatHandler.prototype.loadBVD = function(data) {
        if (!data instanceof ArrayBuffer)
            throw new Error("ArrayBuffer required");

		this.stream = new Uint8Array(data);
		
        var header;
        try {
            header = this.readFileHeader();
        } catch (e) {
            throw new Error("not a BVD stream");
        }
		
			var node = XML3D.data.xflowGraph.createDataNode();

			var dims = createXflowBuffer(node, "gridSize", "float3", 1);  
			var size = createXflowBuffer(node, "size", 	   "float3", 1);
					
			dims[0] = header.dimsX;
			dims[1] = header.dimsY;
			dims[2] = header.dimsZ;
			
			size[0] = header.sizeX;
			size[1] = header.sizeY;
			size[2] = header.sizeZ;
			
			if (header.bytesForValue == 1) 
				this.readOneValue = function() {
					return this.readByte();
				};
			else
				this.readOneValue = function() {
					var binaryDataVal = this.readUInt16();
					// TODO find a better way to transform numbers from source numbers (in our case uShort) to byte size
					
					return Math.round(Math.min(binaryDataVal / 67, 255));
				};
		
			this.ipos = headerSize;  // header size
			
			var dataValsCnt = header.dimsX * header.dimsY * header.dimsZ;
			var volumeData = createXflowBuffer(node, "volumeNumericData", "ubyte", dataValsCnt);
			
			for ( var i = 0; i < dataValsCnt; i++ ) {
				volumeData[i] = this.readOneValue();
			}
			
		return node;
    };

			
	// Export
	XML3D.base.BVDFormatHandler = BVDFormatHandler;
		
    /**
     * @implements IDataAdapter
     */
    var BVDDataAdapter = function(bvdData) {
        try {
            this.xflowDataNode = BVDFormatHandler.prototype.loadBVD(bvdData);
        } catch (e) {
            XML3D.debug.logError("Failed to process BVD file: " + e);
        }
    };

    BVDDataAdapter.prototype.getXflowNode = function() {
        return this.xflowDataNode;
    };

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var BVDFactory = function(){
        XML3D.base.AdapterFactory.call(this, "data");
    };
    XML3D.createClass(BVDFactory, XML3D.resource.AdapterFactory);

    BVDFactory.prototype.aspect = XML3D.data;
    BVDFactory.prototype.createAdapter = function(data) {
        return new BVDDataAdapter(data);
    };

    XML3D.base.resourceManager.addBinaryExtension(".bvd");
    bvdFormatHandler.registerFactoryClass(BVDFactory);

}());
