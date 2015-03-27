var EVENT_TYPE = require("../../renderer/scene/constants.js").EVENT_TYPE;
var DrawableClosure = require("../../renderer/scene/drawableclosure.js");
var GLMesh = require("../base/mesh.js");
var MaterialEvents = require("../materials/events.js");
var XflowUtils = require("./utils.js");
var RectangularCuboid = require("../volume/rectangularcuboid.js");
var OctreeNode = require("../volume/octreenode.js");
var XC = require("../../../xflow/interface/constants.js");
var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;

var noiseTextureSize = 64;

var CHANGE_STATE = {
    NOTHING_CHANGED: 0,
    STRUCTURE_CHANGED: 1,
    TYPE_DATA_CHANGED: 2,
    TYPE_CHANGED: 2 + 1,
    VS_DATA_CHANGED: 4,
    VS_CHANGED: 4 + 1,
    ATTRIBUTE_STRUCTURE_CHANGED: 8,
    ATTRIBUTE_DATA_CHANGED: 16,
    ATTRIBUTE_CHANGED: 24,
    SHADER_CHANGED: 32
};

var READY_STATE = DrawableClosure.READY_STATE;

var VOLUME_PARAMETERS = {
    volumeNumericData: null,
    gridSize: null,
    size: {required: true},
    stepSize: null,
    baseIntensity: null,
    rayTerminationAccuracy: null,
    renderType: null,
    randomizeStartPosition: null,
    octreeNodePosition: null
};

var TYPE_FILTER = Object.keys(VOLUME_PARAMETERS);

var getGLTypeFromArray = function (array) {
    var GL = window.WebGLRenderingContext;
    if (array instanceof Int8Array)
        return GL.BYTE;
    if (array instanceof Uint8Array)
        return GL.UNSIGNED_BYTE;
    if (array instanceof Int16Array)
        return GL.SHORT;
    if (array instanceof Uint16Array)
        return GL.UNSIGNED_SHORT;
    if (array instanceof Int32Array)
        return GL.INT;
    if (array instanceof Uint32Array)
        return GL.UNSIGNED_INT;
    if (array instanceof Float32Array)
        return GL.FLOAT;
    return GL.FLOAT;
};
/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {Object} data
 */
var createBuffer = function (gl, type, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    buffer.length = data.length;
    buffer.glType = getGLTypeFromArray(data);
    return buffer;
};

/**
 *
 * @param {GLContext} context
 * @param {string} type
 * @param {DataNode} data
 * @extends {DrawableClosure}
 * @constructor
 */
var VolumeClosure = function (context, type, dataNode, opt) {
    DrawableClosure.call(this, context, DrawableClosure.TYPES.VOLUME);
    opt = opt || {};
    this.mesh = new GLMesh(context, type);

    /**
     * Data Node of the renderObject
     * @type {DataNode}
     */
    this.dataNode = dataNode;

    /**
     * Shader Composer that will provide ShaderClosure and Program
     * @type {AbstractShaderComposer}
     */
    this.shaderComposer = null;

    /**
     * Shader Closure used by this mesh
     * @type {AbstractShaderClosure}
     */
    this.shaderClosure = null;

    /**
     * Attributes required to create the GLMesh
     * @type {ComputeRequest}
     */
    this.typeRequest = null;

    /**
     * Are all attributes required by drawable available?
     * @type {boolean}
     */
    this.typeDataValid = false; //FIXME: Should this be true?

    /**
     * Attributes and uniforms values for the shader
     * @type {Request}
     */
    this.objectShaderRequest = null;

    /**
     * Are all attributes required by shader available?
     * @type {boolean}
     */
    this.attributeDataValid = true;

    /**
     * Bitfield that records the changes reported by Xflow
     * @private
     * @type {number}
     */
    this.changeState = CHANGE_STATE.STRUCTURE_CHANGED;

    /**
     * Callback if bounding box has changed. Gets only called if
     * this.boundingBoxRequired is true.
     * @type {*|function(Float32Array)}
     */
    this.boundingBoxChanged = opt.boundingBoxChanged || function () {
    };

    this.initialize();
};

XML3D.createClass(VolumeClosure, DrawableClosure, {
    initialize: function () {
        this.typeDataChanged(this.typeRequest, XC.RESULT_STATE.CHANGED_STRUCTURE);
        this.shaderChanged();
    },

    setShaderComposer: function (shaderComposer) {
        if (!this.bindedShaderChanged) this.bindedShaderChanged = this.shaderChanged.bind(this);

        if (this.shaderComposer) {
            this.shaderComposer.removeEventListener(MaterialEvents.MATERIAL_STRUCTURE_CHANGED, this.bindedShaderChanged);
        }

        this.shaderComposer = shaderComposer;
        if (this.shaderComposer) {
            this.shaderComposer.addEventListener(MaterialEvents.MATERIAL_STRUCTURE_CHANGED, this.bindedShaderChanged);
        }

        this.changeState |= CHANGE_STATE.SHADER_CHANGED;
    },

    calculateBoundingBox: function (positions, indices) {
        this.boundingBoxChanged(XflowUtils.calculateBoundingBox(positions, indices));
    },

    /**
     * @param {ComputeRequest} request
     * @param {RESULT_STATE} state
     */
    typeDataChanged: function (request, state) {
        this.changeState |= state == XC.RESULT_STATE.CHANGED_STRUCTURE ? CHANGE_STATE.STRUCTURE_CHANGED : CHANGE_STATE.TYPE_DATA_CHANGED;
        this.context.requestRedraw("Volume Type Data Change");
        XML3D.debug.logInfo("VolumeClosure: Type data changed", request, state, this.changeState);
    },

    getMesh: function () {
        return this.mesh;
    },

    getMeshType: function () {
        return this.mesh.glType;
    },

    updateObjectShaderRequest: function () {
        if (this.objectShaderRequest) {
            this.objectShaderRequest.clear();
        }
        this.objectShaderRequest = null;
        if (this.dataNode.isSubtreeLoading()) {
            return;
        }
        this.objectShaderRequest = this.shaderComposer.createObjectDataRequest(this.dataNode, this.shaderInputDataChanged.bind(this));
    },

    updateShaderClosure: function (scene) {
        this.shaderClosure = null;
        if (!this.dataNode.isSubtreeLoading() && !this.dataNode.getOutputChannelInfo("size")) {
            throw new Error("Volume does not have 'size' attribute.");
        } else {
            this.shaderClosure = this.shaderComposer.getShaderClosure(scene, this.objectShaderRequest);
        }
    },

    update: function (scene) {
        if (this.changeState === CHANGE_STATE.NOTHING_CHANGED) {
            return;
        }
        XML3D.debug.logDebug("Update volume closure", this.changeState);

        var oldValid = !!this.shaderClosure && this.typeDataValid, someError = null, typeDataResolved = false;

        try {
            if (this.changeState) {
                this.updateTypeData();
                typeDataResolved = true;
                this.updateObjectShaderRequest();
                this.updateShaderClosure(scene);
                this.updateObjectShaderData();
            }
        } catch (e) {
            someError = e;
            if (!typeDataResolved)
                this.typeDataValid = false; else
                this.shaderClosure = null;
        }

        var newValid = !!this.shaderClosure && this.typeDataValid;

        if (oldValid != newValid) {
            this.dispatchEvent({
                type: EVENT_TYPE.DRAWABLE_STATE_CHANGED,
                newState: newValid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE,
                oldState: oldValid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE
            });
        }
        this.changeState = CHANGE_STATE.NOTHING_CHANGED;

        if (someError) {
            throw someError;
        }
    },

    /**
     * @param {Object<string,*>} attributes
     * @param {ComputeResult} dataResult
     * @param {function(string)} missingCB
     * @returns boolean true, if all required attributes were set
     */
    updateVolumeFromResult: function (attributes, dataResult, missingCB) {
        this.generateOrLinkNoiseTexture(this.context.gl);
        var dataForVolumeTexture = undefined;
        var updateBuffers;

        var complete = true;
        for (var name in attributes) {
            var param = attributes[name] || {};
            var entry = dataResult.getOutputData(name);
            if (!entry || !entry.getValue()) {
                if (param.required) {
                    // If required and loading has finished, give a call
                    dataResult.loading || missingCB(name);
                    complete = false;
                }
                continue;
            }

            updateBuffers = true;

            switch (name) {
                case "gridSize":
                    var val = entry.getValue();
                    this.sizeX = val[0];
                    this.sizeY = val[1];
                    this.sizeZ = val[2];
                    break;
                case "size":
                    this.updateRepresentativeMesh(entry.getValue());
                    break;
                case "stepSize":
                    var s = entry.getValue()[0];
                    if (s != this.stepSize) {
                        this.stepSize = s;
                        if (this._octree) {
                            this._octree.updateStepSize(this.stepSize);
                        }
                    }
                    break;
                case "volumeNumericData":
                    dataForVolumeTexture = entry;
                    updateBuffers = false;
                    break;
            }

            if (updateBuffers) {
                switch (entry.type) {
                    case XC.DATA_TYPE.TEXTURE:
                        XML3D.debug.logError("Texture as volume parameter is not yet supported");
                        break;
                    default:
                        this.handleBuffer(name, param, entry, this.mesh);
                }
            }
        }

        if (dataForVolumeTexture != undefined) {
            this.createVolumeTextureFromNumericData(dataForVolumeTexture);
        }

        return complete;
    },

    updateVolumePositionsBuffer: function (size) {
        var updateNeeded = true;

        if (!this.recCuboid) {
            this.recCuboid = new RectangularCuboid([0, 0, 0], size);
            this._positionXflowNode = XflowUtils.createBufferInputNode("float3", "position", this.recCuboid.positionsCount);
        } else {
            updateNeeded = this.recCuboid.updatePositions([0, 0, 0], size);
        }

        if (updateNeeded) {
            var entry = this._positionXflowNode._data;
            entry.setValue(this.recCuboid.positions);
            this.positionBuffer = this.handleBuffer("position", {}, entry);
            this.calculateBoundingBox(this.recCuboid.positions, RectangularCuboid.Indices);
        }
    },

    updateRepresentativeMesh: function (size) {
        if (!this._octree) {
            var indices = RectangularCuboid.Indices;
            var indexXflowNode = XflowUtils.createBufferInputNode("int", "index", indices.length);
            var entry = indexXflowNode._data;
            entry.setValue(indices);
            this.handleBuffer("index", {}, entry, this.mesh);
            this._octree = new OctreeNode([0, 0, 0], size, this, this.stepSize);
        } else {
            this._octree.updatePositions([0, 0, 0], size);
        }

        this.updateVolumePositionsBuffer(size);
    },

    createVolumeTextureFromNumericData: function (entry) {
        if (this._octree) {
            var volData = entry.getValue();
            if (volData.length != 0) {
                this._octree.setVolumeData(volData, [this.sizeX, this.sizeY, this.sizeZ]);
            }
        }
    },

    generateOrLinkNoiseTexture: function (gl) {
        var context = this.context;
        if (!this.mesh.noiseTexture) {
            var options = {
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                texels: createOrGetNoiseTextureData()
            };

            var ctex = context.createTexture();
            ctex.createTex2DFromData(gl.RGBA, noiseTextureSize, noiseTextureSize, gl.RGBA, gl.UNSIGNED_BYTE, options);
            ctex.autoGenerated = true;
            this.mesh.noiseTexture = ctex;
        }
    },

    updateObjectShaderData: function () {
        if (!this.shaderClosure) {
            return; // if only the data has changed, it can't get valid after update
        }
        if (!this.bindedHandleBuffer) {
            this.bindedHandleBuffer = this.handleBuffer.bind(this);
        }
        if (!this.bindedHandleUniform) {
            this.bindedHandleUniform = this.handleUniform.bind(this);
        }

        // TODO: SOMEHOW HANDLE THIS:
        this.shaderComposer.distributeObjectShaderData(this.objectShaderRequest, this.bindedHandleBuffer, this.bindedHandleUniform);
        var dataResult = this.typeRequest.getResult();
        var attributes = this.attributes;
        var complete = this.updateVolumeFromResult(attributes, dataResult, function (name) {
            XML3D.debug.logError("Required shader attribute", name, "is missing for volume");
        });
        this.typeDataValid = complete;
    },

    updateTypeData: function () {
        if (!this.typeDataValid && !(this.changeState & CHANGE_STATE.STRUCTURE_CHANGED)) {
            return; // only if structure has changed, it can't get valid after update
        }
        var dataResult = this.typeRequest.getResult();
        XML3D.debug.assert(VOLUME_PARAMETERS, "At this point, we need parameters for the volume");
        var complete = this.updateVolumeFromResult(VOLUME_PARAMETERS, dataResult, function (name) {
            XML3D.debug.logError("Required volume attribute ", name, "is missing for volume");
        });

        var entry = dataResult.getOutputData("vertexCount");
        this.mesh.setVertexCount(entry && entry.getValue() ? entry.getValue()[0] : null);
        this.typeDataValid = complete;
    },

    /**
     * @param {string} name
     * @param {Object} attr
     * @param {BufferEntry} entry
     * @param {GLMesh} mesh
     */
    handleBuffer: function (name, attr, entry, mesh) {
        var webglData = this.context.getXflowEntryWebGlData(entry, this.context.id);
        var buffer = webglData.buffer;
        var gl = this.context.gl;

        switch (webglData.changed) {
            case XC.DATA_ENTRY_STATE.CHANGED_VALUE:
                var bufferType = name == "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                gl.bindBuffer(bufferType, buffer);
                gl.bufferSubData(bufferType, 0, entry.getValue());
                break;
            case XC.DATA_ENTRY_STATE.CHANGED_NEW:
            case XC.DATA_ENTRY_STATE.CHANGED_SIZE:
                if (name == "index") {
                    buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                } else {
                    buffer = createBuffer(gl, gl.ARRAY_BUFFER, entry.getValue());
                }
                buffer.tupleSize = entry.getTupleSize();
                webglData.buffer = buffer;
                break;
        }
        // In every case, set the buffer, because other meshes might have already
        // performed one or more of the tasks above
        if (mesh) {
            //var entryValue = entry.getValue && entry.getValue();
            //console.log("SET BUFFER: " + name + " > " + (entryValue && Array.prototype.join.call(entryValue,", ")));
            mesh.setBuffer(name, buffer);
        }

        webglData.changed = 0;
        return buffer;
    },

    handleUniform: function (name, xflowDataEntry) {
        var value = XflowUtils.getGLUniformValueFromXflowDataEntry(xflowDataEntry, this.context);
        //var entryValue = xflowDataEntry.getValue && xflowDataEntry.getValue();
        //console.log("SET UNIFORM: " + name + " > " + (entryValue && Array.prototype.join.call(entryValue,", ")));
        this.mesh.setUniformOverride(name, value);
    },

    /**
     *
     */
    updateTypeRequest: function () {
        this.typeRequest = new ComputeRequest(this.dataNode, TYPE_FILTER, this.typeDataChanged.bind(this));
    },

    /**
     * @param {ComputeRequest} request
     * @param {RESULT_STATE} state
     */
    attributeDataChanged: function (request, state) {
        this.changeState |= state == XC.RESULT_STATE.CHANGED_STRUCTURE ? CHANGE_STATE.ATTRIBUTE_STRUCTURE_CHANGED : CHANGE_STATE.ATTRIBUTE_DATA_CHANGED;
        this.context.requestRedraw("Volume Attribute Data Changed");
        XML3D.debug.logInfo("VolumeClosure: Attribute data changed", request, state, this.changeState);
    },

    /**
     * Returns a compute request for custom mesh parameters
     * @param {Array.<string>} filter
     * @param {function(ComputeRequest, RESULT_STATE)} callback
     */
    getRequest: function (filter, callback) {
        return new ComputeRequest(this.dataNode, filter, callback);
    },

    /**
     * @param {ComputeRequest} request
     * @param {RESULT_STATE} state
     */
    shaderInputDataChanged: function (request, state) {
        this.changeState |= state != XC.RESULT_STATE.CHANGED_DATA_VALUE ? CHANGE_STATE.STRUCTURE_CHANGED : CHANGE_STATE.VS_DATA_CHANGED;
        // TODO: We don't know if the change of data only influences the surface shading or the actual mesh shape
        this.dispatchEvent({type: EVENT_TYPE.SCENE_SHAPE_CHANGED});
        this.context.requestRedraw("Volume Attribute Data Changed");
        XML3D.debug.logInfo("VolumeClosure: Attribute data changed", request, state, this.changeState);
    },

    shaderChanged: function () {
        this.changeState |= CHANGE_STATE.SHADER_CHANGED;
    },

    getProgram: function () {
        return this.shaderClosure;
    }
});


var c_noiseTextureData;
function createOrGetNoiseTextureData() {
    if (!c_noiseTextureData) {
        var noiseTextureData = new Uint8Array(noiseTextureSize * noiseTextureSize * 4);

        for (var i = 0; i < noiseTextureData.length; i += 4) {
            noiseTextureData[i] = Math.floor(Math.random() * 255);
            noiseTextureData[i + 1] = Math.floor(Math.random() * 255);
            noiseTextureData[i + 2] = Math.floor(Math.random() * 255);
            noiseTextureData[i + 3] = 255;
        }
        c_noiseTextureData = noiseTextureData;
    }
    return c_noiseTextureData;
}

module.exports = VolumeClosure;

