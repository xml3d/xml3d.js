var SystemNotifier = require("../../webgl/system/system-notifier.js");
var RenderNode = require("./rendernode.js");
var DrawableClosure= require("./drawableclosure.js");
var C = require("./constants.js");
var Scene= require("./scene.js");

/**
 * @interface
 */
var IRenderObject = function () {
};
IRenderObject.prototype.getModelViewMatrix = function () {
};
IRenderObject.prototype.getModelViewProjectionMatrix = function () {
};
IRenderObject.prototype.getModelMatrixN = function () {
};
IRenderObject.prototype.getModelViewMatrixN = function () {
};
IRenderObject.prototype.getObjectSpaceBoundingBox = function () {
};
IRenderObject.prototype.getWorldSpaceBoundingBox = function () {
};
IRenderObject.prototype.updateWorldSpaceMatrices = function () {
};
IRenderObject.prototype.isVisible = function () {
};
IRenderObject.prototype.setTransformDirty = function () {
};
IRenderObject.prototype.setShader = function () {
};
IRenderObject.prototype.hasTransparency = function () {
};

// Entry:
/** @const */
var WORLD_MATRIX_OFFSET = 0;
/** @const */
var LOCAL_MATRIX_OFFSET = WORLD_MATRIX_OFFSET + 16;
/** @const */
var OBJECT_BB_OFFSET = LOCAL_MATRIX_OFFSET + 16;
/** @const */
var WORLD_BB_OFFSET = OBJECT_BB_OFFSET + 6;
/** @const */
var MODELVIEW_MATRIX_OFFSET = WORLD_BB_OFFSET + 6;
/** @const */
var MODELVIEWPROJECTION_MATRIX_OFFSET = MODELVIEW_MATRIX_OFFSET + 16;
/** @const */
var MODEL_MATRIX_N_OFFSET = MODELVIEWPROJECTION_MATRIX_OFFSET + 16;
/** @const */
var MODELVIEW_MATRIX_N_OFFSET = MODEL_MATRIX_N_OFFSET + 16;
/** @const */
var ENTRY_SIZE = MODELVIEW_MATRIX_N_OFFSET + 16;

//noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
/**
 * Represents a renderable object in the scene.
 * The RenderObject has these responsibilities:
 *  1. Keep track of the transformation hierarchy and bounding boxes
 *  2. Connect the DrawableClosure with the ShaderClosure
 *
 *  The {@link DrawableClosure} is a DrawableObject plus it's data
 *  The {@link ShaderClosure} is a ProgramObject plus it's data
 *  The concrete ShaderClosure can vary per DrawableObject and change
 *  due to scene or object changes. Thus we have to keep track of the
 *  related {@link IShaderComposer}.
 *
 * @constructor
 * @implements {IRenderObject}
 * @param {Scene} scene
 * @param {Object} pageEntry
 * @param {Object} opt
 */
var RenderObject = function (scene, pageEntry, opt) {
    RenderNode.call(this, C.NODE_TYPE.OBJECT, scene, pageEntry, opt);
    opt = opt || {};

    /**
     * Keep reference to DOM Element need e.g. for picking
     * @type {Element}
     */
    this.node = opt.node;

    /**
     * Object related data
     * @type {{data: Xflow.DataNode|null, type: string}}
     */
    this.object = opt.object || {data: null, type: "triangles"};

    /**
     * Can we rely on current WorldMatrix?
     * @type {boolean}
     */
    this.transformDirty = true;

    /**
     * Can we rely on current Bounding Boxes?
     * @type {boolean}
     */
    this.boundingBoxDirty = true;

    this.transformDataRequest = this.createTransformRequest();

    /**
     * The drawable closure transforms object data and type into
     * a drawable entity
     * @type {DrawableClosure}
     */
    this.drawable = this.createDrawable();

    this.localShaderHandle = opt.shaderHandle || null;
    this.shaderHandle = null;

    /** {Object?} **/
    this.override = null;


};
RenderObject.ENTRY_SIZE = ENTRY_SIZE;

RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();

XML3D.createClass(RenderObject, RenderNode, {
    createTransformRequest: function () {
        if (!this.object.data)
            return null;
        var request = new Xflow.ComputeRequest(this.object.data, ["meshTransform"], this.onTransformDataChange.bind(this));
        return request;
    },

    createDrawable: function () {
        var result = this.scene.createDrawable(this);
        if (result) {
            var that = this;
            result.addEventListener(C.EVENT_TYPE.DRAWABLE_STATE_CHANGED, function (evt) {
                if (evt.newState === DrawableClosure.READY_STATE.COMPLETE) {
                    that.scene.moveFromQueueToReady(that);
                } else if (evt.newState === DrawableClosure.READY_STATE.INCOMPLETE && evt.oldState === DrawableClosure.READY_STATE.COMPLETE) {
                    that.scene.moveFromReadyToQueue(that);
                }
            });
            result.updateTypeRequest();
            result.calculateBoundingBox();
            result.addEventListener(C.EVENT_TYPE.SCENE_SHAPE_CHANGED, function (evt) {
                that.scene.dispatchEvent({type: C.EVENT_TYPE.SCENE_SHAPE_CHANGED})
            })
        }
        return result;
    },

    setType: function (type) {
        this.object.type = type;
        // TODO: this.typeChangedEvent
    },

    getType: function () {
        return this.object.type;
    },

    getDataNode: function () {
        return this.object ? this.object.data : null;
    },

    getLocalMatrix: function (dest) {
        var o = this.offset + LOCAL_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            dest[i] = this.page[o];
        }
    },

    setLocalMatrix: function (source) {
        var o = this.offset + LOCAL_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            this.page[o] = source[i];
        }
        this.setTransformDirty();
        this.setBoundingBoxDirty();
    },

    dispose: function () {
        this.transformDataRequest && this.transformDataRequest.clear();
        this.scene.remove(this);
    }, onTransformDataChange: function () {
        this.setTransformDirty();
    },

    getModelViewMatrix: function (target) {
        var o = this.offset + MODELVIEW_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            target[i] = this.page[o];
        }
    },

    getModelMatrixN: function (target) {
        var o = this.offset + MODEL_MATRIX_N_OFFSET;
        target[0] = this.page[o];
        target[1] = this.page[o + 1];
        target[2] = this.page[o + 2];
        target[3] = this.page[o + 4];
        target[4] = this.page[o + 5];
        target[5] = this.page[o + 6];
        target[6] = this.page[o + 8];
        target[7] = this.page[o + 9];
        target[8] = this.page[o + 10];
    },

    getModelViewMatrixN: function (target) {
        var o = this.offset + MODELVIEW_MATRIX_N_OFFSET;
        target[0] = this.page[o];
        target[1] = this.page[o + 1];
        target[2] = this.page[o + 2];
        target[3] = this.page[o + 4];
        target[4] = this.page[o + 5];
        target[5] = this.page[o + 6];
        target[6] = this.page[o + 8];
        target[7] = this.page[o + 9];
        target[8] = this.page[o + 10];
    },


    getModelViewProjectionMatrix: function (dest) {
        var o = this.offset + MODELVIEWPROJECTION_MATRIX_OFFSET;
        for (var i = 0; i < 16; i++, o++) {
            dest[i] = this.page[o];
        }
    },

    updateWorldSpaceMatrices: function (view, projection) {
        if (this.transformDirty) {
            this.updateWorldMatrix();
        }
        this.updateModelViewMatrix(view);
        this.updateModelMatrixN();
        this.updateModelViewMatrixN();
        this.updateModelViewProjectionMatrix(projection);
    },

    updateWorldMatrix: (function () {
        var tmp_mat = XML3D.math.mat4.create();
        return function () {
            this.parent.getWorldMatrix(tmp_mat);
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(tmp_mat, 0, page, offset + LOCAL_MATRIX_OFFSET, tmp_mat, 0);
            if (this.transformDataRequest) {
                var result = this.transformDataRequest.getResult();
                var transformData = result.getOutputData("meshTransform");
                if (transformData && transformData.getValue()) {
                    XML3D.math.mat4.multiply(tmp_mat, tmp_mat, transformData.getValue());
                }
            }
            this.setWorldMatrix(tmp_mat);
            this.boundingBoxDirty = true;
            this.transformDirty = false;
        }
    })(),

    /** Relies on an up-to-date transform matrix **/
    updateModelViewMatrix: function (view) {
        if (this.transformDirty) {
            this.updateWorldMatrix();
        }
        var page = this.page;
        var offset = this.offset;
        XML3D.math.mat4.multiplyOffset(page, offset + MODELVIEW_MATRIX_OFFSET, page, offset + WORLD_MATRIX_OFFSET, view, 0);
    },

    updateModelMatrixN: (function () {
        var c_tmpMatrix = XML3D.math.mat4.create();
        return function () {
            this.getWorldMatrix(c_tmpMatrix);
            var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
            normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
            var o = this.offset + MODEL_MATRIX_N_OFFSET;
            for (var i = 0; i < 16; i++, o++) {
                this.page[o] = normalMatrix[i];
            }
        }
    })(),

    /** Relies on an up-to-date view matrix **/
    updateModelViewMatrixN: (function () {
        var c_tmpMatrix = XML3D.math.mat4.create();
        return function () {
            this.getModelViewMatrix(c_tmpMatrix);
            var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
            normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
            var o = this.offset + MODELVIEW_MATRIX_N_OFFSET;
            for (var i = 0; i < 16; i++, o++) {
                this.page[o] = normalMatrix[i];
            }
        }
    })(),


    /** Relies on an up-to-date view matrix **/
    updateModelViewProjectionMatrix: function (projection) {
        var page = this.page;
        var offset = this.offset;
        XML3D.math.mat4.multiplyOffset(page, offset + MODELVIEWPROJECTION_MATRIX_OFFSET, page, offset + MODELVIEW_MATRIX_OFFSET, projection, 0);
    },

    setTransformDirty: function () {
        this.transformDirty = true;
        this.setBoundingBoxDirty();
        this.scene.dispatchEvent({type: C.EVENT_TYPE.SCENE_SHAPE_CHANGED});
        this.scene.requestRedraw("Transformation changed");
    }, /**
     * @param {AdapterHandleNotification} notification
     */
    shaderHandleCallback: function (notification) {
        XML3D.debug.assert(notification.type == XML3D.events.ADAPTER_HANDLE_CHANGED);
        this.updateShaderFromHandle(notification.adapterHandle);
    },

    setLocalShaderHandle: function (newHandle) {
        this.localShaderHandle = newHandle;
        if (newHandle === undefined) {
            // Shader was removed, we need to propagate the parent shader down
            this.setShader(this.parent.getShaderHandle());
        } else {
            this.setShader(newHandle);
        }

    },

    setShader: function (newHandle) {

        // If we don't have a drawable, we don't need a shader
        // This is for testing purposes and won't occur during normal
        // run
        if (!this.drawable)
            return;

        if (this.localShaderHandle)
            newHandle = this.localShaderHandle;

        var oldHandle = this.shaderHandle;

        if (oldHandle == newHandle)
            return;

        if (!this.bindedShaderHandleCallback) this.bindedShaderHandleCallback = this.shaderHandleCallback.bind(this);

        if (oldHandle) {
            oldHandle.removeListener(this.bindedShaderHandleCallback);
        }
        if (newHandle) {
            newHandle.addListener(this.bindedShaderHandleCallback);
        }
        this.shaderHandle = newHandle;
        this.updateShaderFromHandle(newHandle);

        // TODO this.materialChanged();
    },

    /**
     *
     * @param {AdapterHandle|null} handle
     */
    updateShaderFromHandle: function (handle) {
        var shaderInfo = null;

        if (handle) {
            switch (handle.status) {
                case XML3D.base.AdapterHandle.STATUS.NOT_FOUND:
                    XML3D.debug.logWarning("Shader not found.", handle.url, this.name);
                    break;
                case XML3D.base.AdapterHandle.STATUS.LOADING:
                    break;
                case XML3D.base.AdapterHandle.STATUS.READY:
                    shaderInfo = handle.getAdapter().getShaderInfo();
            }
        }

        var composer = this.scene.shaderFactory.createComposerForShaderInfo(shaderInfo);
        this.drawable.setShaderComposer(composer);
    },

    setObjectSpaceBoundingBox: function (box) {
        var o = this.offset + OBJECT_BB_OFFSET;
        this.page[o] = box[0];
        this.page[o + 1] = box[1];
        this.page[o + 2] = box[2];
        this.page[o + 3] = box[3];
        this.page[o + 4] = box[4];
        this.page[o + 5] = box[5];
        this.setBoundingBoxDirty();
    },

    getObjectSpaceBoundingBox: function (box) {
        var o = this.offset + OBJECT_BB_OFFSET;
        box[0] = this.page[o];
        box[1] = this.page[o + 1];
        box[2] = this.page[o + 2];
        box[3] = this.page[o + 3];
        box[4] = this.page[o + 4];
        box[5] = this.page[o + 5];
    },

    setBoundingBoxDirty: function () {
        this.boundingBoxDirty = true;
        this.parent.setBoundingBoxDirty();
    },

    setWorldSpaceBoundingBox: function (bbox) {
        var o = this.offset + WORLD_BB_OFFSET;
        this.page[o] = bbox[0];
        this.page[o + 1] = bbox[1];
        this.page[o + 2] = bbox[2];
        this.page[o + 3] = bbox[3];
        this.page[o + 4] = bbox[4];
        this.page[o + 5] = bbox[5];
    },

    getWorldSpaceBoundingBox: function (bbox) {
        if (this.boundingBoxDirty) {
            this.updateWorldSpaceBoundingBox();
        }
        var o = this.offset + WORLD_BB_OFFSET;
        bbox[0] = this.page[o];
        bbox[1] = this.page[o + 1];
        bbox[2] = this.page[o + 2];
        bbox[3] = this.page[o + 3];
        bbox[4] = this.page[o + 4];
        bbox[5] = this.page[o + 5];

    },

    updateWorldSpaceBoundingBox: (function () {
        var c_box = new XML3D.math.bbox.create();
        var c_trans = new XML3D.math.mat4.create();

        return function () {
            this.getObjectSpaceBoundingBox(c_box);
            this.getWorldMatrix(c_trans);
            XML3D.math.bbox.transform(c_box, c_trans, c_box);
            this.setWorldSpaceBoundingBox(c_box);
            this.boundingBoxDirty = false;
        }
    })(),

    setLocalVisible: function (newVal) {
        this.localVisible = newVal;
        this.setVisible(this.parent && this.parent.isVisible() && newVal);
        this.setBoundingBoxDirty();
    },

    getProgram: function () {
        return this.drawable.getProgram();
    },

    hasTransparency: function () {
        var program = this.getProgram();
        return program ? program.hasTransparency() : false;
    },

    updateForRendering: function () {
        SystemNotifier.setNode(this.node);
        this.setShader(this.parent.getShaderHandle());
        try {
            this.drawable && this.drawable.update(this.scene);
        } catch (e) {
            XML3D.debug.logError("Mesh Error: " + e.message, this.node);
        }
        SystemNotifier.setNode(null);
    },

    findRayIntersections: (function () {
        var bbox = XML3D.math.bbox.create();
        var opt = {dist: 0};

        return function (ray, intersections) {
            this.getWorldSpaceBoundingBox(bbox);
            if (XML3D.math.bbox.intersects(bbox, ray, opt)) {
                intersections.push(this);
            }
        }
    })()

});


// Export
module.exports = RenderObject;

