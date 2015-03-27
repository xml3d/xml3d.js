var OctreeDataAdapter = require("./octreedataadapter.js");
var OctreeComposer = require("./octreecomposer.js");
var RectangularCuboid = require("./rectangularcuboid.js");
var XflowUtils = require("../xflow/utils.js");

// Register the raycaster program
require("./raycaster.js");

/*  OctreeNode class
 is used by XflowVolume for recursive subdividing volumes into eight octants
 subdividing takes place if given node can not be rendered
 this may be because of :
 a) too small step size (<=0.0025)
 b) too big texture size for volume source data (>gl.MAX_TEXTURE_SIZE)
 */

var REASONS_TO_SPLIT = {
    BIG_DATA: 0, SMALL_STEP_SIZE: 1, USER_REQUEST: 2
};

var SORTING_ORDER = [];
SORTING_ORDER[0] = [7, 5, 6, 3, 1, 2, 4, 0];
SORTING_ORDER[1] = [6, 7, 4, 2, 0, 3, 5, 1];
SORTING_ORDER[2] = [5, 7, 4, 1, 0, 3, 6, 2];
SORTING_ORDER[3] = [4, 5, 6, 0, 1, 2, 7, 3];
SORTING_ORDER[4] = [3, 1, 2, 7, 5, 6, 0, 4];
SORTING_ORDER[5] = [2, 0, 3, 6, 7, 4, 1, 5];
SORTING_ORDER[6] = [1, 0, 3, 5, 7, 4, 2, 6];
SORTING_ORDER[7] = [0, 1, 2, 4, 5, 6, 3, 7];

/**
 * @constructor
 * @implements {IRenderObject}
 */
var OctreeNode = function (position, size, volumeClosure, stepSize, parent) {

    OctreeDataAdapter.call(this, parent);

    this.boundingBoxDirty = true;
    this.wsbbox = new XML3D.math.bbox.create();
    this.visible = true;
    this.parent = parent;
    this.drawable = volumeClosure;
    this.initRepresentativeMesh(position, size);

    if (stepSize)
        this.updateStepSize(stepSize);
};

XML3D.createClass(OctreeNode, OctreeDataAdapter);


OctreeNode.prototype.getProgram = function () {
    return this.drawable.getProgram();
};

OctreeNode.prototype.getModelViewMatrix = function (target) {
    return this.renderObject.getModelViewMatrix(target);
};

OctreeNode.prototype.getModelViewProjectionMatrix = function (dest) {
    return this.renderObject.getModelViewProjectionMatrix(dest);
};

OctreeNode.prototype.getNormalMatrix = function (target) {
    return this.renderObject.getNormalMatrix(target);
};

OctreeNode.prototype.getObjectSpaceBoundingBox = function (box) {
    if (!this.parent)
        return this.renderObject.getObjectSpaceBoundingBox(box);

    for (var i = 0; i < 6; i++)
        box[i] = this.bbox[i];
};

OctreeNode.prototype.setWorldSpaceBoundingBox = function (bbox) {
    for (var i = 0; i < 6; i++)
        this.wsbbox[i] = bbox[i];
};

OctreeNode.prototype.getWorldSpaceBoundingBox = function (bbox) {
    if (!this.parent)
        return this.renderObject.getWorldSpaceBoundingBox(bbox);

    if ((this.renderObject.boundingBoxDirty) || (this.boundingBoxDirty)) {
        this.updateWorldSpaceBoundingBox();
    }

    for (var i = 0; i < 6; i++)
        bbox[i] = this.wsbbox[i];
};

OctreeNode.prototype.updateWorldSpaceBoundingBox = function () {
    var c_box = new XML3D.math.bbox.create();
    var c_trans = new XML3D.math.mat4.create();

    this.getObjectSpaceBoundingBox(c_box);
    this.renderObject.parent.getWorldMatrix(c_trans);
    XML3D.math.bbox.transform(c_box, c_trans, c_box);
    this.setWorldSpaceBoundingBox(c_box);
    this.boundingBoxDirty = false;
};


OctreeNode.prototype.updateWorldSpaceMatrices = function (view, projection) {
    return this.renderObject.updateWorldSpaceMatrices(view, projection);
};

OctreeNode.prototype.isVisible = function () {
    return this.renderObject.isVisible();
};

OctreeNode.prototype.setTransformDirty = function () {
    return this.renderObject.setTransformDirty();
};

OctreeNode.prototype.setShader = function (newHandle) {
    return this.renderObject.setShader(newHandle);
};

OctreeNode.prototype.hasTransparency = function () {
    return this.renderObject.hasTransparency();
};


OctreeNode.prototype.addVolumeOverrides = function (override) {
    if (override == null)
        override = {};

    override["size"] = this.sizeArray;
    override["viewPortSize"] = this.drawable.context.backfaceTarget.allocatedDrawingBufferSize;

    if (this.gridSizeZ) {
        override["gridSizeZ"] = this.gridSizeZ;
        override["mosaicFactor"] = this.mosaicFactorArray;
    }

    if (this.stepSizeArray)
        override["stepSize"] = this.stepSizeArray;

    if (this.volumeDataTexture) {
        override["outerGridSize"] = this.volumeDataTexture.outerGridSize;
        override["gridStep"] = this.volumeDataTexture.gridStep;
    }

    override["octreeIsSplit"] = (this.parent != undefined);
    override["octreeLevel"] = this.octreeLevelArray;
    override["octreeNodePosition"] = this.octreeNodePositionArray;
    override["octreeNodeRelativePosition"] = this.octreeNodeRelativePositionArray;

    if (this.overlapClose) {
        override["overlapClose"] = this.overlapClose;
        override["overlapFar"] = this.overlapFar;
    }

    return override;
};


OctreeNode.prototype.initRepresentativeMesh = function (position, size) {
    this.recCuboid = new RectangularCuboid(position, size);

    this.bbox = XflowUtils.calculateBoundingBox(this.recCuboid.positions, RectangularCuboid.Indices);

    this._positionXflowNode = XflowUtils.createBufferInputNode("float3", "position", this.recCuboid.positionsCount);
    var entry = this._positionXflowNode._data;
    entry.setValue(this.recCuboid.positions);
    this.positionBuffer = this.drawable.handleBuffer("position", {}, entry);

    this.sizeArray = new Float32Array([size[0], size[1], size[2]]);
    this.setOctreeNodePosition(position);
};

OctreeNode.prototype.updateStepSize = function (stepSize) {
    // warning X3569: loop executes for more than 255 iterations (maximum for this shader target)
    // For small step size:
    // 0,0025  	- loops inside the shader execute 1/0,0025 = 400 times
    // 0,001  	- loops inside the shader execute 1/0,001 =  1000 times

    this.stepSizeArray = new Float32Array([stepSize]);
    var iterationsCount = 1 / stepSize;

    if (iterationsCount > 255) {
        var result = this.needChildren(REASONS_TO_SPLIT.SMALL_STEP_SIZE);

        if (result == OctreeComposer.NEED_CHILDREN_RESULT.NEW_CREATED) {
            return;
        }
    } else {
        if (!this.hasChildren())
            return; else
            this.tryDeactivateChildren(REASONS_TO_SPLIT.SMALL_STEP_SIZE);
    }

    for (var i = 0; i < 8; i++)
        this.childrenNodes[i].updateStepSize(stepSize * 2);
};

OctreeNode.prototype.setOctreeNodePosition = function (position) {

    this.octreeNodePositionArray = new Float32Array([position[0], position[1], position[2]]);
    this.updateOctreeNodeRelativePositionArray();
};

OctreeNode.prototype.updateOctreeNodePosition = function (position) {
    this.octreeNodePositionArray[0] = position[0];
    this.octreeNodePositionArray[1] = position[1];
    this.octreeNodePositionArray[2] = position[2];

    this.updateOctreeNodeRelativePositionArray();
};

OctreeNode.prototype._setGridSize = function (gridSize) {
    this.gridSizeArray = gridSize;
    this.gridSizeZ = new Float32Array([gridSize[2]]);
};

OctreeNode.prototype._updateGridSize = function (gridSize) {
    this.gridSizeArray = gridSize;
    this.gridSizeZ[0] = gridSize[2];
};

OctreeNode.prototype.getSortingVariant = function (cameraPosition) {
    // the idea was found here http://www.sea-of-memes.com/LetsCode4/LetsCode4.html
    var vCenter = XML3D.math.vec3.create();
    var vBBox = XML3D.math.bbox.create();
    this.getWorldSpaceBoundingBox(vBBox);
    XML3D.math.bbox.center(vCenter, vBBox);

    if (cameraPosition[0] > vCenter[0])
        if (cameraPosition[1] > vCenter[1])
            return (cameraPosition[2] > vCenter[2]) ? 7 : 3; else
            return (cameraPosition[2] > vCenter[2]) ? 5 : 1; else if (cameraPosition[1] > vCenter[1])
        return (cameraPosition[2] > vCenter[2]) ? 6 : 2; else
        return (cameraPosition[2] > vCenter[2]) ? 4 : 0;
};

OctreeNode.prototype.getSortedNodes = function (obj, array, cameraPosition) {
    if (!this.visible)
        return;

    this.renderObject = obj;
    this.program = obj.program;

    if (this.hasActiveChildren()) {
        var sortingVariant = this.getSortingVariant(cameraPosition);
        var sorted = SORTING_ORDER[sortingVariant];
        for (var i = 0; i < 8; i++)
            this.childrenNodes[sorted[i]].getSortedNodes(obj, array, cameraPosition);
    } else
        array.push(this);
};

OctreeNode.REASONS_TO_SPLIT = REASONS_TO_SPLIT;

module.exports = OctreeNode;

	
