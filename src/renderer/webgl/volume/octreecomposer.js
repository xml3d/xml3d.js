var NEED_CHILDREN_RESULT = {
    NEW_CREATED: 0, ACTIVATED: 1, ALREADY_ACTIVE: 2
};

/**
 * @constructor
 */
var OctreeComposer = function () {
    this.childrenNodes = undefined;
};

OctreeComposer.prototype.generateChildren = function () {
    if (this.hasChildren()) {
        XML3D.debug.logError("Children nodes for octree node were already generated!");
        return;
    }

    this.childrenNodes = [];
    var childrenSize = [this.sizeArray[0] / 2, this.sizeArray[1] / 2, this.sizeArray[2] / 2];

    var childrenPositions = this.getChildrenPositions(this.octreeNodePositionArray, childrenSize);

    for (var i = 0; i < 8; i++) {
        this.childrenNodes[i] = new XML3D.webgl.OctreeNode(childrenPositions[i], childrenSize, this.drawable, this.stepSizeArray[0] * 2, this);
    }

    this.childrenActive = true;
};

OctreeComposer.prototype.hasChildren = function () {
    return (this.childrenNodes != undefined);
};

OctreeComposer.prototype.hasActiveChildren = function () {
    return this.childrenActive;
};

OctreeComposer.prototype.needChildren = function (reason) {

    this._addReason(reason);

    if (this.hasChildren()) {
        if (!this.childrenActive) {
            this.childrenActive = true;
            return NEED_CHILDREN_RESULT.ACTIVATED;
        }
        return NEED_CHILDREN_RESULT.ALREADY_ACTIVE;
    } else {
        this.generateChildren();

        if (reason != webgl.OctreeNode.REASONS_TO_SPLIT.BIG_DATA)
            this.setChildrenGridPositionAndSize();

        return NEED_CHILDREN_RESULT.NEW_CREATED;
    }
};

OctreeComposer.prototype._addReason = function (reason) {
    if (!this.reasonsToSplit) {
        this.reasonsToSplit = [];
    }

    this.reasonsToSplit[reason] = true;
};

OctreeComposer.prototype._deleteReason = function (reason) {
    delete this.reasonsToSplit[reason];
};

OctreeComposer.prototype.tryDeactivateChildren = function (reason) {
    var i;
    if (!this.hasActiveChildren())
        return;

    this._deleteReason(reason);

    if (Object.keys(this.reasonsToSplit).length == 0) {
        this.childrenActive = false;

        for (i = 0; i < 8; i++)
            this.recursiveDeactivate(this.childrenNodes[i], reason);
    } else {
        for (i = 0; i < 8; i++)
            this.childrenNodes[i].tryDeactivateChildren(reason);
    }
};

OctreeComposer.prototype.recursiveDeactivate = function (reason) {
    if (!this.hasActiveChildren())
        return;

    this._deleteReason(reason);
    this.childrenActive = false;

    for (var i = 0; i < 8; i++)
        this.recursiveDeactivate(this.childrenNodes[i], reason);
};


OctreeComposer.prototype.getChildrenPositions = function (parentPosition, size) {
    var position = [];
    position[0] = parentPosition;
    position[1] = [parentPosition[0] + size[0], parentPosition[1], parentPosition[2]];
    position[2] = [parentPosition[0], parentPosition[1] + size[1], parentPosition[2]];
    position[3] = [parentPosition[0] + size[0], parentPosition[1] + size[1], parentPosition[2]];

    position[4] = [parentPosition[0], parentPosition[1], parentPosition[2] + size[2]];
    position[5] = [parentPosition[0] + size[0], parentPosition[1], parentPosition[2] + size[2]];
    position[6] = [parentPosition[0], parentPosition[1] + size[1], parentPosition[2] + size[2]];
    position[7] = [parentPosition[0] + size[0], parentPosition[1] + size[1], parentPosition[2] + size[2]];
    return position;
};

OctreeComposer.prototype.updatePositions = function (position, size) {

    var updateNeeded = this.recCuboid.updatePositions(position, size);

    if (updateNeeded) {
        this.boundingBoxDirty = true;

        this.sizeArray[0] = size[0];
        this.sizeArray[1] = size[1];
        this.sizeArray[2] = size[2];
        this.updateOctreeNodePosition(position);

        var entry = this._positionXflowNode._data;
        entry.setValue(this.recCuboid.positions);
        this.positionBuffer = this.drawable.handleBuffer("position", {}, entry);

        this.bbox = XML3D.webgl.calculateBoundingBox(this.recCuboid.positions, XML3D.webgl.RectangularCuboidIndices);

        if (this.hasChildren()) {
            var childrenSize = [size[0] / 2, size[1] / 2, size[2] / 2];

            var childrenPositions = this.getChildrenPositions(position, childrenSize);

            for (var i = 0; i < 8; i++)
                this.childrenNodes[i].updatePositions(childrenPositions[i], childrenSize);
        }
    }
};

OctreeComposer.prototype.updateOctreeNodeRelativePositionArray = function () {
    if (this.octreeLevelArray[0] > 1) {
        var parent = this.parent;
        while (parent.octreeLevelArray[0] > 1)
            parent = parent.parent;

        this.octreeNodeRelativePositionArray = new Float32Array([this.octreeNodePositionArray[0] - parent.octreeNodePositionArray[0], this.octreeNodePositionArray[1] - parent.octreeNodePositionArray[1], this.octreeNodePositionArray[2] - parent.octreeNodePositionArray[2]]);
    } else
        this.octreeNodeRelativePositionArray = this.octreeNodePositionArray;
};


OctreeComposer.prototype.getChildrenGridSize = function (gridSize) {
    if (gridSize)
        return new Float32Array([(gridSize[0] / 2), (gridSize[1] / 2), (gridSize[2] / 2)]);

    return new Float32Array([(this.gridSizeArray[0] / 2), (this.gridSizeArray[1] / 2), (this.gridSizeArray[2] / 2)]);
};

OctreeComposer.prototype.setChildrenGridPositionAndSize = function () {
    if (!this.gridSizeArray)
        return;

    if (!this.hasChildren())
        return;

    var gridPosition;
    var childrenGridSize = this.getChildrenGridSize();
    var gridPositions = this.getChildrenGridPositionsConsiderSelfPosition(childrenGridSize);

    for (var i = 0; i < 8; i++) {
        gridPosition = gridPositions[i];
        this.childrenNodes[i].gridPositionArray = new Float32Array([gridPosition[0], gridPosition[1], gridPosition[2]]);

        this.childrenNodes[i]._setGridSize(childrenGridSize);
        this.childrenNodes[i].mosaicFactorArray = this.mosaicFactorArray;
        this.childrenNodes[i].setChildrenGridPositionAndSize();
    }
};

OctreeComposer.prototype.getChildrenGridPositionsConsiderSelfPosition = function (childrenGridSize) {

    var selfPos = this.gridPositionArray ? this.gridPositionArray : [0, 0, 0];

    var position = [];
    position[0] = [selfPos[0], selfPos[1] + childrenGridSize[1], selfPos[2]];
    position[1] = [selfPos[0] + childrenGridSize[0], selfPos[1] + childrenGridSize[1], selfPos[2]];
    position[2] = [selfPos[0], selfPos[1], selfPos[2]];
    position[3] = [selfPos[0] + childrenGridSize[0], selfPos[1], selfPos[2]];

    position[4] = [selfPos[0], selfPos[1] + childrenGridSize[1], selfPos[2] + childrenGridSize[2]];
    position[5] = [selfPos[0] + childrenGridSize[0], selfPos[1] + childrenGridSize[1], selfPos[2] + childrenGridSize[2]];
    position[6] = [selfPos[0], selfPos[1], selfPos[2] + childrenGridSize[2]];
    position[7] = [selfPos[0] + childrenGridSize[0], selfPos[1], selfPos[2] + childrenGridSize[2]];

    return position;
};

OctreeComposer.NEED_CHILDREN_RESULT = NEED_CHILDREN_RESULT;
module.exports = OctreeComposer;

