var OctreeComposer = require("./octreecomposer.js");
var OctreeNode = require("./octreenode.js");

/*  OctreeDataAdapter class
 is used by OctreeNode to manage volume data
 */

/**
 * @constructor
 */
var OctreeDataAdapter = function (parent) {

    OctreeComposer.call(this);

    if (parent)
        if (OctreeNode.REASONS_TO_SPLIT.BIG_DATA in parent.reasonsToSplit)
            this.octreeLevelArray = new Float32Array([1.0]); else {
            this.octreeLevelArray = new Float32Array([parent.octreeLevelArray[0] * 2]);
            this.volumeDataTexture = parent.volumeDataTexture;
            this.overlapClose = parent.overlapClose;
            this.overlapFar = parent.overlapFar;
        } else
        this.octreeLevelArray = new Float32Array([1.0]);
};

XML3D.createClass(OctreeDataAdapter, OctreeComposer);

OctreeDataAdapter.prototype.setVolumeData = function (volumeDataArray, volumeGridSize) {
    if (this.volumeDataArray == volumeDataArray)
        return;

    this.volumeDataArray = volumeDataArray;

    this.generateChildrenIfDataDoesNotFitOneTexture(volumeGridSize);
    this._setGridSize(volumeGridSize);
    this.setChildrenGridPositionAndSize();

    this.fillOctreeWithData({
        volumeDataArray: volumeDataArray, volumeGridSize: volumeGridSize
    });

    this.recursiveUpdateOctreeDataDependentProperties();
};

OctreeDataAdapter.prototype.recursiveUpdateOctreeDataDependentProperties = function () {
    if (this.parent) {
        this.overlapClose = this.overlapClose || this.parent.overlapClose;
        this.overlapFar = this.overlapFar || this.parent.overlapFar;
    }

    this.updateOctreeLevel();
    this.updateOctreeNodeRelativePositionArray();

    if (this.hasChildren())
        for (var i = 0; i < 8; i++)
            this.childrenNodes[i].recursiveUpdateOctreeDataDependentProperties();
};

OctreeDataAdapter.prototype.updateOctreeLevel = function () {
    if (this.parent)
        if (OctreeNode.REASONS_TO_SPLIT.BIG_DATA in this.parent.reasonsToSplit)
            this.octreeLevelArray[0] = 1; else
            this.octreeLevelArray[0] = this.parent.octreeLevelArray[0] * 2; else
        this.octreeLevelArray[0] = 1;
};

OctreeDataAdapter.prototype.getMaxGridSizeWithOverlaps = function (trueGridSize) {
    return [Math.ceil(trueGridSize[0] + 2), Math.ceil(trueGridSize[1] + 2), Math.ceil(trueGridSize[2] + 2)];
};

OctreeDataAdapter.prototype.generateChildrenIfDataDoesNotFitOneTexture = function (trueGridSize) {
    this.volumeDataTexture = undefined;
    this.isDataLeaf = false;

    var maxGridSize = this.parent ? this.getMaxGridSizeWithOverlaps(trueGridSize) : trueGridSize;

    var xFactor = this.calculateXFactor(maxGridSize[2]);
    var texture2DWidth = xFactor * maxGridSize[0];
    var texture2DHeight = xFactor * maxGridSize[1];

    var gl = this.drawable.context.gl;
    var glMaxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    var maxTexSize = glMaxTextureSize * glMaxTextureSize;
    var dataValsCnt = texture2DWidth * texture2DHeight;

    if (dataValsCnt > maxTexSize) {
        this.needChildren(OctreeNode.REASONS_TO_SPLIT.BIG_DATA);

        var childrenGridSize = this.getChildrenGridSize(trueGridSize);
        for (var i = 0; i < 8; i++)
            this.childrenNodes[i].generateChildrenIfDataDoesNotFitOneTexture(childrenGridSize);

    } else {
        if (this.hasActiveChildren()) {
            // try to deactivate children if data can fit into one texture
            // this need may occur only if volume data changes at run-time, and only if first data did not fit into one texture
            this.tryDeactivateChildren(OctreeNode.REASONS_TO_SPLIT.BIG_DATA);
        }

        this.isDataLeaf = true;
    }
};

OctreeDataAdapter.prototype.fillOctreeWithData = function (volumeData) {
    if (this.isDataLeaf) {
        this.assignOverlaps(volumeData);
        this.create2DTextureFromData(volumeData);
    } else
        for (var i = 0; i < 8; i++)
            this.childrenNodes[i].fillOctreeWithData(volumeData);
};

OctreeDataAdapter.prototype.assignOverlaps = function (volumeData) {
    if (!this.gridPositionArray)
        return;

    this.overlapClose = new Float32Array([0, 0, 0]);
    this.overlapFar = new Float32Array([0, 0, 0]);

    var trueGridSize = new Float32Array([0, 0, 0]);
    var trueGridPosition = new Float32Array([0, 0, 0]);

    var posClose, posFar, newPosClose, newPosFar, decimalPart;

    for (var j = 0; j < 3; j++) {
        posClose = newPosClose = this.gridPositionArray[j];
        posFar = newPosFar = this.gridPositionArray[j] + this.gridSizeArray[j];

        if (posClose > 0) {
            // calc close overlap
            decimalPart = posClose % 1;

            if (decimalPart < 0.5)  // need previous pixel
                newPosClose = Math.floor(posClose - 1); else
                newPosClose = Math.floor(posClose);

            this.overlapClose[j] = posClose - newPosClose;
        }

        if (posFar < volumeData.volumeGridSize[j]) {
            // calc far overlap
            decimalPart = posFar % 1;

            if (decimalPart > 0.5)  // need next pixel
                newPosFar = Math.floor(posFar + 2); else
                newPosFar = Math.floor(posFar + 1);

            this.overlapFar[j] = newPosFar - posFar;
        }

        trueGridSize[j] = newPosFar - newPosClose;
        trueGridPosition[j] = newPosClose;
    }

    this.trueGridPosition = trueGridPosition;
    this._updateGridSize(trueGridSize);
};

OctreeDataAdapter.prototype.calculateXFactor = function (sizeZ) {
    var root = Math.ceil(Math.sqrt(sizeZ));
    var power = Math.ceil(Math.log(root) / Math.log(2));
    return Math.pow(2, power);
};

OctreeDataAdapter.prototype._recognizeDataFormat = function (volumeDataArray) {

    if (volumeDataArray instanceof Uint8Array)
        this.readOneValue = function (volumeDataArray, idx) {
            return volumeDataArray[idx];
        }; else
        this.readOneValue = function (volumeDataArray, idx) {
            // TODO find a better way to transform numbers from source numbers (in our case uShort) to byte size
            return Math.round(Math.min(volumeDataArray[idx] / 67, 255));
        };
};

OctreeDataAdapter.prototype._assignMosaicFactor = function (mosaicFactorArray) {
    this.mosaicFactorArray = mosaicFactorArray;

    if (this.hasChildren())
        for (var i = 0; i < 8; i++)
            this.childrenNodes[i]._assignMosaicFactor(mosaicFactorArray);
};

OctreeDataAdapter.prototype.create2DTextureFromData = function (volumeData) {
    var volData = volumeData.volumeDataArray;
    this._recognizeDataFormat(volData);

    var gridSize = this.gridSizeArray;

    var xFactor = this.calculateXFactor(gridSize[2]);
    var texture2DWidth = xFactor * gridSize[0];
    var texture2DHeight = xFactor * gridSize[1];
    this._assignMosaicFactor(new Float32Array([xFactor, xFactor]));


    if (this.trueGridPosition) {
        var gridPosition = this.trueGridPosition;
        var parentGridSize = volumeData.volumeGridSize;

        this._getIndexToRead = function (i, x, y, z) {
            return (x + gridPosition[0]) + (y + gridPosition[1]) * (parentGridSize[0]) + (z + gridPosition[2]) * (parentGridSize[0] * parentGridSize[1]);
        };
    } else
        this._getIndexToRead = function (i) {
            return (i + 1);
        };

    var volTexture2d = new Uint8Array(texture2DWidth * texture2DHeight);
    var densityVal, row, column, offset, k, i = -1;

    // build one texture containing all slices :
    // volData      -  density values for X x Y x Z volume, Z slices of size X x Y
    // volTexture2d -  2d texture for uploading to the GPU
    // we put slices from volData one by one to volTexture2d
    // example: if volData contains 5 slices, in volTexture2d they will be joined like this:
    // 1 2 3
    // 4 5
    for (var z = 0; z < gridSize[2]; z++) {
        column = gridSize[0] * (z % xFactor);
        row = gridSize[1] * Math.floor(z / xFactor);
        offset = ( (row * texture2DWidth) + column );

        for (var y = 0; y < gridSize[1]; y++) {
            k = offset;
            for (var x = 0; x < gridSize[0]; x++) {
                i = this._getIndexToRead(i, x, y, z);
                densityVal = this.readOneValue(volData, i);

                volTexture2d[k++] = densityVal; // only red channel
            }
            offset = offset + ( texture2DWidth );
        }
    }

    var context = this.drawable.context;
    var gl = context.gl;

    var options = {
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        texels: volTexture2d
    };

    var ctex = context.createTexture();
    // gl.RGBA replaced with gl.LUMINANCE (use only one RED color channel), trying to optimize performance
    // but GL nevertheless transforms it to RGBA replicating values from R channel to G and B, and setting A to 1
    // http://www.khronos.org/opengles/sdk/docs/man/xhtml/glTexImage2D.xml
    // so unfortunately we save not as much time and memory here as wanted,
    // but performance tests show at least two times improvement of "Data transform" time
    ctex.createTex2DFromData(gl.LUMINANCE, texture2DWidth, texture2DHeight, gl.LUMINANCE, gl.UNSIGNED_BYTE, options);
    ctex.autoGenerated = true;
    ctex.outerGridSize = new Float32Array([gridSize[0], gridSize[1], gridSize[2]]);
    ctex.gridStep = new Float32Array([1 / (this.mosaicFactorArray[0] * gridSize[0]), 1 / (this.mosaicFactorArray[1] * gridSize[1])]);
    this.assignVolumeDataTexture(ctex);
};

OctreeDataAdapter.prototype.assignVolumeDataTexture = function (ctexure) {
    this.volumeDataTexture = ctexure;

    if (this.hasChildren())
        for (var i = 0; i < 8; i++)
            this.childrenNodes[i].assignVolumeDataTexture(ctexure);
};

module.exports = OctreeDataAdapter;
	
