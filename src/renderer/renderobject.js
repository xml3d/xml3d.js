(function () {

    var StateMachine = window.StateMachine;

    // Entry:
    // 1: WorldTransformation [16 floats]
    var TRANSFORMATION_OFFSET = 0;
    var MODELVIEW_OFFSET = 16;
    var MODELVIEWPROJECTION_OFFSET = 32;
    var NORMAL_OFFSET = 48;

    var ENTRY_SIZE = 64;
    var PAGE_SIZE = 12;

    var RenderObjectHandler = function() {

        this.pages = [];
        this.nextOffset = 0;
        this.firstOpaqueIndex = 0;

        this.remove = function(obj) {
            var index = this.ready.indexOf(obj);
            if (index == -1) {
                index = this.queue.indexOf(obj);
                this.queue.splice(index, 1);
            } else
                this.ready.splice(index, 1);
        };
        this.clear = function() {
            this.ready = [];
            this.queue = [];
        };
        this.moveFromQueueToReady = function(obj) {
            var index = this.queue.indexOf(obj);
            if (index != -1) {
                this.queue.splice(index, 1);
                if(obj.shader.program.hasTransparency) {
                    this.ready.unshift(obj);
                    this.firstOpaqueIndex++;
                }
                else {
                this.ready.push(obj);
            }
            }
        };
        this.moveFromReadyToQueue = function(obj) {
            var index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
                if(index < this.firstOpaqueIndex)
                    this.firstOpaqueIndex--;
                this.queue.push(obj);
            }
        };
        this.remove = function(obj) {
            var index = this.queue.indexOf(obj);
            if (index != -1) {
                this.queue.splice(index, 1);
            }
            index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
                if(index < this.firstOpaqueIndex)
                    this.firstOpaqueIndex--;
            }
        };
        this.consolidate = function() {
            this.queue.slice().forEach(function(obj) {
                while (obj.can('progress') && obj.progress() == StateMachine.Result.SUCCEEDED ) {};
                if(obj.current == "NoMesh") {
                    if (obj.dataComplete() !== StateMachine.Result.SUCCEEDED) {
                        obj.dataNotComplete();
                    }
                }
            });
        }
        this.updateLights = function(lights, shaderManager) {
            if (lights.structureChanged) {
                this.forEach(function(obj) { obj.lightsChanged(lights, shaderManager); }, this);
                lights.structureChanged = false;
            } else {
                this.queue.forEach(function(obj) {
                    if (obj.current == "NoLights")
                        obj.lightsChanged(lights, shaderManager);
                }, this);
            }
        }
        this.forEach = function(func, that) {
            this.queue.slice().forEach(func, that);
            this.ready.slice().forEach(func, that);
        }

        this.createPageEntry = function() {
            var offset = this.nextOffset;
            var page = offset>>PAGE_SIZE;
            var localOffset = offset&((1<<PAGE_SIZE)-1);
            if(!this.pages[page]) {
                XML3D.debug.logInfo("New page:" + page);
                this.pages[page] = new Float32Array(1<<PAGE_SIZE);
            }
            this.nextOffset += ENTRY_SIZE;
            return { page: this.pages[page], offset : localOffset};
        }

        this.createRenderObject = function(opt) {
            var pageEntry = this.createPageEntry();
            var renderObject = new RenderObject(this, pageEntry, opt);
            return renderObject;
        }
        this.clear();
    };
    /**
     * Represents a renderable object in the scene.
     *
     * @constructor
     * @param {RenderObjectHandler} handler
     * @param {Object} pageEntry
     * @param {Object} opt
     */
    var RenderObject = function (handler, pageEntry, opt) {
        // console.log(pageEntry);
        this.handler = handler;
        this.page = pageEntry.page;
        this.offset = pageEntry.offset;
        this.meshAdapter = opt.meshAdapter;
        this.shaderAdapter = null;
        this.shader = opt.shader || null;
        this.setTransformation(opt.transform || RenderObject.IDENTITY_MATRIX);
        this.visible = opt.visible !== undefined ? opt.visible : true;
        this.meshAdapter.renderObject = this;
        /** {Object?} **/
        this.override = null;
        this.create();
    };

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();


    RenderObject.prototype = {
        onenterReady:function () {
            //console.log("Entering Ready state");
            this.handler.moveFromQueueToReady(this);
        },
        onleaveReady:function () {
            //console.log("Leaving Ready state");
            this.handler.moveFromReadyToQueue(this);
        },
        onafterlightsChanged:function (name, from, to, lights, shaderManager) {
            if (lights) {
                var shaderHandle = this.meshAdapter.getShaderHandle();
                this.shaderAdapter = shaderHandle && shaderHandle.getAdapter();
                this.shader = shaderManager.createShader(this.shaderAdapter, lights);
            }
        },
        onbeforedataComplete:function (name, from, to) {
            //console.log("Before data complete");
            if(!this.meshAdapter.finishMesh()) {
                return false;
            }
            return true;
        },
        onbeforeprogress:function (name, from, to) {
            //console.log("Before progress", arguments);
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
            this.handler.remove(this);
        },
        onchangestate:function (name, from, to) {
            XML3D.debug.logInfo("Changed: ", name, from, to);
        }
    };

   RenderObject.prototype.getTransformation = function(target) {
        var o = this.offset + TRANSFORMATION_OFFSET;
        for(var i = 0; i < 16; i++, o++) {
            target[i] = this.page[o];
        }
    };

    RenderObject.prototype.getModelViewMatrix = function(target) {
        var o = this.offset + MODELVIEW_OFFSET;
        for(var i = 0; i < 16; i++, o++) {
            target[i] = this.page[o];
        }
    }

    RenderObject.prototype.getNormalMatrix = function(target) {
        var o = this.offset + NORMAL_OFFSET;
        target[0] = this.page[o];
        target[1] = this.page[o+1];
        target[2] = this.page[o+2];
        target[3] = this.page[o+4];
        target[4] = this.page[o+5];
        target[5] = this.page[o+6];
        target[6] = this.page[o+8];
        target[7] = this.page[o+9];
        target[8] = this.page[o+10];
    }

    RenderObject.prototype.getModelViewProjectionMatrix = function(target) {
        var o = this.offset + MODELVIEWPROJECTION_OFFSET;
        for(var i = 0; i < 16; i++, o++) {
            target[i] = this.page[o];
        }
    }

    /** Relies on an up-to-date transform matrix **/
    RenderObject.prototype.updateModelViewMatrix = function(view) {
        var page = this.page;
        var offset = this.offset;
        XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEW_OFFSET, page, offset+TRANSFORMATION_OFFSET,  view, 0);
    }

    /** Relies on an up-to-date view matrix **/
    var c_tmpMatrix = XML3D.math.mat4.create();
    RenderObject.prototype.updateNormalMatrix = function() {
        this.getModelViewMatrix(c_tmpMatrix);
        var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
        normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
        var o = this.offset + NORMAL_OFFSET;
        for(var i = 0; i < 16; i++, o++) {
            this.page[o] = normalMatrix[i];
        }
    }

    /** Relies on an up-to-date view matrix **/
    RenderObject.prototype.updateModelViewProjectionMatrix = function(projection) {
        var page = this.page;
        var offset = this.offset;
        XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEWPROJECTION_OFFSET, page, offset+MODELVIEW_OFFSET,  projection, 0);
    }


    RenderObject.prototype.setTransformation = function(source) {
        var o = this.offset + TRANSFORMATION_OFFSET;
        for(var i = 0; i < 16; i++, o++) {
            this.page[o] = source[i];
        }
    };

    /**
     * @param {Xflow.Result} result
     */
    RenderObject.prototype.setOverride = function(result) {
        if(!result.outputNames.length)
            return;

        var prog = this.shader.program;
        this.override = Object.create(null);
        for(var name in prog.uniforms) {
            var entry = result.getOutputData(name);
            if (entry && entry.getValue())
                this.override[name] = entry.getValue();
        }
        XML3D.debug.logInfo("Shader attribute override", result, this.override);
    };


    StateMachine.create({
        target:RenderObject.prototype,
        events:[
            { name:'create', from:'none', to:'NoLights'   },
            // batch processing
            { name:'progress', from:'NoLights', to:'NoMaterial'   },
            { name:'progress', from:'NoMaterial', to:'NoMesh'   },
            { name:'dataNotComplete', from:'NoMesh', to:'NoMeshData' },
            { name:'dataComplete', from:'NoMesh', to:'Ready' },
            { name:'progress', from:'DirtyMeshData', to:'Ready' },
            // events
            { name:'lightsChanged', from: ['NoLights','NoMaterial', 'NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoLights' },
            { name:'materialChanged', from: ['NoMaterial', 'NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoMaterial' },
            { name:'materialChanged', from: ['NoLights'], to:'NoLights' },
            { name:'dataStructureChanged', from: ['NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoMesh' },
            { name:'dataValueChanged', from: ['Ready', 'DirtyMeshData'], to:'DirtyMeshData' },
            { name:'dispose', from:'*', to:'Disposed' }
        ]});

    // Export
    XML3D.webgl.RenderObject = RenderObject;
    XML3D.webgl.RenderObjectHandler = RenderObjectHandler;
}());
