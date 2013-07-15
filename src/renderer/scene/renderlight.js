(function(webgl) {

    /** @const */
    var XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION = XML3D.math.vec3.fromValues(0,0,-1);
    /** @const */
    var XML3D_SPOTLIGHT_DEFAULT_DIRECTION = XML3D.math.vec3.fromValues(0,0,1);

    /** @const */
    var LIGHT_DEFAULT_INTENSITY = XML3D.math.vec3.fromValues(1,1,1);
    /** @const */
    var LIGHT_DEFAULT_ATTENUATION = XML3D.math.vec3.fromValues(0,0,1);
    /** @const */
    var SPOTLIGHT_DEFAULT_FALLOFFANGLE = Math.PI / 4.0;
    /** @const */
    var SPOTLIGHT_DEFAULT_SOFTNESS = 0.0;

    /** @const */
    var ENTRY_SIZE = 16;

    /**
     * @constructor
     * @param {Scene} scene
     * @param {Object} pageEntry
     * @param {Object} opt
     * @extends {RenderNode}
     */
    var RenderLight = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, webgl.Scene.NODE_TYPE.LIGHT ,scene, pageEntry, opt);
        var light = opt.light || {};
        this.light = {
            type : light.type,
            data : light.data
        }
        this.intensity   = XML3D.math.vec3.clone(LIGHT_DEFAULT_INTENSITY);
        this.position    = XML3D.math.vec3.fromValues(0,0,0);
        this.direction   = XML3D.math.vec3.clone(XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION);
        this.attenuation = XML3D.math.vec3.clone(LIGHT_DEFAULT_ATTENUATION);

        this.lightShader = opt.shader;
        //this.listenerID = this.lightShader.registerLightListener(this.updateLightData.bind(this));
        this.localIntensity = opt.localIntensity;
        this.initializeLightData();
    };
    RenderLight.ENTRY_SIZE = ENTRY_SIZE;

    XML3D.createClass(RenderLight, webgl.RenderNode);
    XML3D.extend(RenderLight.prototype, {
        initializeLightData: function() {
            var lightEntry = this.scene.lights[this.light.type];
            if (Array.isArray(lightEntry)) {
                this.addLightToScene(lightEntry);
            } else {
                this.scene.lights.queue.push(this);
            }
        },
        addLightToScene : function(container) {
            container.push(this);
            this.updateWorldMatrix(); //Implicitly fills light position/direction
            //this.updateLightData("visibility", this.visible ? [1,1,1] : [0,0,0]);
            //this.lightShader.fillLightData(this.lightType, lightEntry, this.localIntensity, this.lightOffset);
        },
        getLightData: function(target, offset) {
            var off3 = offset*3;
            ["position", "direction", "attenuation"].forEach( function(name) {
                if(target[name]) {
                    target[name][off3+0] = this[name][0];
                    target[name][off3+1] = this[name][1];
                    target[name][off3+2] = this[name][2];
                }
            }, this);
            if (target["intensity"]) {
                target["intensity"][off3+0] = this.intensity[0] * this.localIntensity;
                target["intensity"][off3+1] = this.intensity[1] * this.localIntensity;
                target["intensity"][off3+2] = this.intensity[2] * this.localIntensity;
            }
            if (target["on"]) {
                target["on"][offset] = this.visible;
            }

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
            switch (this.light.type) {
                case "directional":
                    XML3D.math.vec3.copy(this.direction, this.applyTransformDir(XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION, transform));
                    break;
                case "spot":
                    XML3D.math.vec3.copy(this.direction, this.applyTransformDir(XML3D_SPOTLIGHT_DEFAULT_DIRECTION, transform));
                    XML3D.math.vec3.copy(this.position, this.applyTransform([0,0,0], transform));
                    break;
                case "point":
                    XML3D.math.vec3.copy(this.position, this.applyTransform([0,0,0], transform));
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

        setLocalVisible: function(newVal) {
            this.localVisible = newVal;
            if (newVal === false) {
                this.visible = false;
                this.updateLightData("visibility", [0,0,0]);
            } else {
                this.setVisible(this.parent.isVisible());
            }
        },

        setVisible: function(newVal) {
            if (this.localVisible !== false) {
                this.visible = newVal;
                // this.updateLightData("visibility", this.visible ? [1,1,1] : [0,0,0]);
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
            lo.length--;
        },

        getWorldSpaceBoundingBox: function(bbox) {
            bbox.min[0] = Number.MAX_VALUE;
            bbox.min[1] = Number.MAX_VALUE;
            bbox.min[2] = Number.MAX_VALUE;
            bbox.max[0] = -Number.MAX_VALUE;
            bbox.max[1] = -Number.MAX_VALUE;
            bbox.max[2] = -Number.MAX_VALUE;
        }

    });

    webgl.RenderLight = RenderLight;


})(XML3D.webgl);
