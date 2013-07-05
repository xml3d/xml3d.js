(function () {

    /**
     *
     * @interface
     */
    var IRenderNode = function() {};
    IRenderNode.prototype.getObjectSpaceBoundingBox = function() {};
    IRenderNode.prototype.getWorldMatrix = function() {};
    IRenderNode.prototype.getWorldSpaceBoundingBox = function() {};
    IRenderNode.prototype.getChildren = function() {};
    IRenderNode.prototype.getParent = function() {};
    IRenderNode.prototype.setParent = function() {};
    IRenderNode.prototype.setTransformDirty = function() {};

    /**
     *
     * @interface
     * @extends {IRenderNode}
     */
    var IRenderGroup = function() {};
    IRenderGroup.prototype.getLocalMatrix = function() {};
    IRenderGroup.prototype.setLocalMatrix = function() {};
    IRenderGroup.prototype.addChild = function() {};

    /**
     *
     * @interface
     * @extends {IRenderNode}
     */
    var IRenderObject = function() {};
    IRenderObject.prototype.getModelViewMatrix = function() {};
    IRenderObject.prototype.getModelViewProjectionMatrix = function() {};
    IRenderObject.prototype.getNormalMatrix = function() {};
    IRenderObject.prototype.isVisible = function() {};

    // Entry:
    // 1: WorldTransformation [16 floats]
    var LOCAL_MATRIX_OFFSET = 0;
    var WORLD_MATRIX_OFFSET = 16;
    var MODELVIEW_MATRIX_OFFSET = 32;
    var MODELVIEWPROJECTION_MATRIX_OFFSET = 48;
    var NORMAL_MATRIX_OFFSET = 64;


    /**
     * @constructor
     * @implements {IRenderNode}
     * @param scene
     * @param pageEntry
     * @param opt
     */
    var RenderNode = function(scene, pageEntry, opt) {
        this.parent = opt.parent;
        if (this.parent) {
            this.parent.addChild(this);
        }

        this.scene = scene;
        this.page = pageEntry.page;
        this.offset = pageEntry.offset;
        this.localVisible = opt.visible;
        this.visible = this.localVisible !== undefined ? this.localVisible : this.parent ? this.parent.isVisible() : true;
        this.transformDirty = true;
        this.children = [];
    };

    XML3D.extend(RenderNode.prototype, {

        getChildren: function() {
            return this.children;
        },

        getParent: function() {
            return this.parent;
        },

        setParent: function(parent) {
            this.parent = parent;
            if (parent && parent.addChild) {
                parent.addChild(this);
            }
        },

        getWorldSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getObjectSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getWorldMatrix: function(dest) {
            if (this.transformDirty) {
                this.parent.getWorldMatrix(dest);
                this.updateWorldMatrix(dest);
            }
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        setWorldMatrix: function(source) {
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.transformDirty = false;
        },

        isVisible: function() {
            return this.visible;
        },

        setTransformDirty: function() {
            this.transformDirty = true;
        },

        setLocalVisible: function(newVal) {
            this.localVisible = newVal;
            if (this.parent.isVisible()) {
                // if parent is not visible this group is also invisible
                this.setVisible(newVal);
            }
        },

        setVisible: function(newVal) {
            var downstream = newVal;
            if (this.localVisible === false) {
                downstream = false;
            }
            this.visible = downstream;
            this.children.forEach(function(obj) {
                obj.setVisible(downstream);
            });
        },

        remove: function() {
            this.parent.removeChild(this);
        }

    });

    XML3D.webgl.RenderNode = RenderNode;

    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     * Represents a renderable object in the scene.
     *
     * @constructor
     * @implements {IRenderObject}
     * @param {Scene} scene
     * @param {Object} pageEntry
     * @param {Object} opt
     */
    var RenderObject = function (scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, scene, pageEntry, opt);
        // console.log(pageEntry);
        this.meshAdapter = opt.meshAdapter;
        this.shader = opt.shader || null;
        /** {Object?} **/
        this.override = null;
        this.setWorldMatrix(opt.transform || RenderObject.IDENTITY_MATRIX);
        this.transformDirty = true;
        this.create();
    };

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();
    XML3D.createClass(RenderObject, XML3D.webgl.RenderNode);
    XML3D.extend(RenderObject.prototype, {
        onenterReady:function () {
            this.scene.moveFromQueueToReady(this);
        },
        onleaveReady:function () {
            this.scene.moveFromReadyToQueue(this);
        },
        onafterlightsChanged:function (name, from, to, lights, shaderManager) {
            if (lights) {
                var shaderHandle = this.parent.getShaderHandle();
                this.shader = shaderManager.createShader(shaderHandle.adapter, lights);
            }
        },
        onbeforedataComplete:function (name, from, to) {
            return this.meshAdapter.finishMesh();
        },
        onbeforeprogress: function(name, from, to) {
            switch (to) {
                case "NoMaterial":
                    return this.shader != null;
            }
            switch (from) {
                case "DirtyMeshData":
                    this.meshAdapter.createMeshData();
            }
        },
        onenterNoMesh:function () {
            // Trigger the creation of the mesh now
            // this.meshAdapter.createMesh();
            return true;
        },
        onenterDisposed:function () {
            this.scene.remove(this);
        },
        onchangestate:function (name, from, to) {
            XML3D.debug.logInfo("Changed: ", name, from, to);
        },

        getModelViewMatrix: function(target) {
            var o = this.offset + MODELVIEW_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                target[i] = this.page[o];
            }
        },

        getNormalMatrix: function(target) {
            var o = this.offset + NORMAL_MATRIX_OFFSET;
            target[0] = this.page[o];
            target[1] = this.page[o+1];
            target[2] = this.page[o+2];
            target[3] = this.page[o+4];
            target[4] = this.page[o+5];
            target[5] = this.page[o+6];
            target[6] = this.page[o+8];
            target[7] = this.page[o+9];
            target[8] = this.page[o+10];
        },

        getModelViewProjectionMatrix: function(dest) {
            var o = this.offset + MODELVIEWPROJECTION_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        updateWorldSpaceMatrices: function(view, projection) {
            if (this.transformDirty) {
                this.updateWorldMatrix();
            }
            this.updateModelViewMatrix(view);
            this.updateNormalMatrix();
            this.updateModelViewProjectionMatrix(projection);
        },

        updateWorldMatrix: (function() {
            var tmp_mat = XML3D.math.mat4.create();
            return function() {
                this.parent.getWorldMatrix(tmp_mat);
                this.setWorldMatrix(tmp_mat);
                this.transformDirty = false;
            }
        })(),

        /** Relies on an up-to-date transform matrix **/
        updateModelViewMatrix: function(view) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEW_MATRIX_OFFSET, page, offset+WORLD_MATRIX_OFFSET,  view, 0);
        },

        /** Relies on an up-to-date view matrix **/
        updateNormalMatrix: (function() {
            var c_tmpMatrix = XML3D.math.mat4.create();
            return function () {
                this.getModelViewMatrix(c_tmpMatrix);
                var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
                normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
                var o = this.offset + NORMAL_MATRIX_OFFSET;
                for(var i = 0; i < 16; i++, o++) {
                    this.page[o] = normalMatrix[i];
                }
            }
        })(),

        /** Relies on an up-to-date view matrix **/
        updateModelViewProjectionMatrix: function(projection) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEWPROJECTION_MATRIX_OFFSET, page, offset+MODELVIEW_MATRIX_OFFSET,  projection, 0);
        },

        /*
         * @param {Xflow.Result} result
         */
        setOverride: function(result) {
            if(!result.outputNames.length)
                return;

            var prog = this.shader.program;
            this.override = Object.create(null);
            for(var name in prog.uniforms) {
                var entry = result.getOutputData(name);
                if (entry && entry.getValue()) {
                    this.override[name] = entry.getValue();
                }
            }
            XML3D.debug.logInfo("Shader attribute override", result, this.override);
        },

        setTransformDirty: function() {
            this.transformDirty = true;
        },

        setShader: function(newHandle) {
            this.meshAdapter.updateShader(newHandle.adapter);
        }

    });

    // Export
    XML3D.webgl.RenderObject = RenderObject;

    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     *
     * @constructor
     * @implements {IRenderGroup}
     */
    var RenderGroup = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, scene, pageEntry, opt);
        this.shaderHandle = opt.shaderHandle || null;
    };
    XML3D.createClass(RenderGroup, XML3D.webgl.RenderNode);
    XML3D.extend(RenderGroup.prototype, {
        getLocalMatrix: function(dest) {
            var o = this.offset + LOCAL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        setLocalMatrix: function(source) {
            var o = this.offset + LOCAL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.setTransformDirty();
        },

        getWorldSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getObjectSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        addChild: function(child) {
            this.children.push(child);
        },

        removeChild: function(child) {
            this.children.splice(this.children.indexOf(child), 1);
        },

        getChildren: function() {
            return this.children;
        },

        updateWorldMatrix: function(source) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+WORLD_MATRIX_OFFSET, page, offset+LOCAL_MATRIX_OFFSET,  source, 0);
            this.transformDirty = false;
        },

        setTransformDirty: function() {
            this.transformDirty = true;
            this.children.forEach(function(obj) {
                obj.setTransformDirty();
            });
        },

        setLocalShaderHandle: function(newHandle) {
            this.shaderHandle = undefined;
            if (newHandle === undefined) {
                // Shader was removed, we need to propagate the parent shader down
                this.setShader(this.parent.getShaderHandle());
            } else {
                this.setShader(newHandle);
            }
            this.shaderHandle = newHandle;
        },

        setShader: function(newHandle) {
            if (this.shaderHandle !== undefined) {
                // Local shader overrides anything coming from upstream
                return;
            }
            this.children.forEach(function(obj) {
                obj.setShader(newHandle);
            });
        },

        getShaderHandle: function() {
            if (!this.shaderHandle) {
                return this.parent.getShaderHandle();
            }
            return this.shaderHandle;
        }

    });

    // Export
    XML3D.webgl.RenderGroup = RenderGroup;

    /** @const */
    var XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION = XML3D.math.vec3.fromValues(0,0,-1);
    /** @const */
    var XML3D_SPOTLIGHT_DEFAULT_DIRECTION = XML3D.math.vec3.fromValues(0,0,1);

    var RenderLight = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, scene, pageEntry, opt);
        this.lightShader = opt.shader;
        this.listenerID = this.lightShader.registerLightListener(this.updateLightData.bind(this));
        this.lightType = opt.lightType;
        this.lightOffset = pageEntry.lightOffset * 3;
        this.localIntensity = opt.localIntensity;
        this.initializeLightData();
    };

    XML3D.createClass(RenderLight, XML3D.webgl.RenderNode);
    XML3D.extend(RenderLight.prototype, {
        initializeLightData: function() {
            var lightEntry = this.scene.lights[this.lightType];
            lightEntry.renderLight[this.lightOffset/3] = this;
            this.updateWorldMatrix(); //Implicitly fills light position/direction
            this.updateLightData("visibility", this.visible ? [1,1,1] : [0,0,0]);
            this.lightShader.fillLightData(this.lightType, lightEntry, this.localIntensity, this.lightOffset);
        },

        updateLightData: function(field, newValue) {
            var offset = this.lightOffset;
            var data = this.scene.lights[this.lightType][field];
            if (!data) {
                return;
            }
            if(field=="falloffAngle" || field=="softness") {
                offset/=3; //some parameters are scalar
            }
            Array.set(data, offset, newValue);
            this.scene.lights.changed = true;
        },

        setTransformDirty: function() {
            this.updateWorldMatrix();
        },

        updateWorldMatrix: (function() {
            var tmp_mat = XML3D.math.mat4.create();
            return function() {
                this.parent.getWorldMatrix(tmp_mat);
                this.setWorldMatrix(tmp_mat);
                this.updateLightTransformData(tmp_mat);
            }
        })(),

        updateLightTransformData: function(transform) {
            if (this.lightType == "directional") {
                this.updateLightData("direction", this.applyTransformDir(XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION, transform));
            } else if (this.lightType == "spot") {
                this.updateLightData("direction", this.applyTransformDir(XML3D_SPOTLIGHT_DEFAULT_DIRECTION, transform));
                this.updateLightData("position", this.applyTransform([0,0,0], transform));
            } else {
                this.updateLightData("position", this.applyTransform([0,0,0], transform));
            }
        },

        applyTransform: function(vec, transform) {
            var newVec = XML3D.math.vec4.transformMat4(XML3D.math.vec4.create(), [vec[0], vec[1], vec[2], 1], transform);
            return [newVec[0]/newVec[3], newVec[1]/newVec[3], newVec[2]/newVec[3]];
        },

        applyTransformDir: function(vec, transform) {
            var newVec = XML3D.math.vec4.transformMat4(XML3D.math.vec4.create(), [vec[0], vec[1], vec[2], 0], transform);
            return [newVec[0], newVec[1], newVec[2]];
        },

        setVisible: function(newVal) {
            if (this.localVisible !== false) {
                this.visible = newVal;
                this.updateLightData("visibility", this.visible ? [1,1,1] : [0,0,0]);
            }
        },

        setLocalIntensity: function(intensity) {
            this.localIntensity = intensity;
            var shaderIntensity = this.lightShader.requestParameter("intensity").getValue();
            this.updateLightData("intensity", [shaderIntensity[0]*intensity, shaderIntensity[1]*intensity, shaderIntensity[2]*intensity]);
        },

        remove: function() {
            this.parent.removeChild(this);
            this.removeLightData();
            this.scene.lights.structureChanged = true;
            this.lightShader.removeLightListener(this.listenerID);
        },

        removeLightData: function() {
            var lo = this.scene.lights[this.lightType];
            var offset = this.lightOffset;
            if (this.lightType == "directional" || this.lightType === "spot") {
                lo.direction.splice(offset, 3);
            }
            if (this.lightType !== "directional") {
                lo.position.splice(offset, 3);
            }
            lo.visibility.splice(offset, 3);
            this.lightShader.removeLight(this.lightType, lo, offset);
            lo.renderLight.splice(this.lightOffset/3, 1);
            lo.length--;
        }

    });

    XML3D.webgl.RenderLight = RenderLight;

}());
