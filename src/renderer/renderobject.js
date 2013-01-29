(function () {

    var StateMachine = window.StateMachine;

    var RenderObjectHandler = function() {
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
                this.ready.push(obj);
            }
        };
        this.moveFromReadyToQueue = function(obj) {
            var index = this.ready.indexOf(obj);
            if (index != -1) {
                this.ready.splice(index, 1);
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
        this.clear();
    };
    /**
     * Represents a renderable object in the scene.
     *
     * This object holds references to a mesh and shader stored in their respective managers, or in the
     * case of XFlow a local instance of these objects, since XFlow may be applied differently to different
     * instances of the same <data> element. It also holds the current transformation matrix for the object,
     * a flag to indicate visibility (not visible = will not be rendered), and a callback function to be used by
     * any adapters associated with this object (eg. the mesh adapter) to propagate changes (eg. when the
     * parent group's shader is changed).
     *
     * @constructor
     */
    var RenderObject = function (opt) {
        this.handler = opt.handler;
        this.meshAdapter = opt.meshAdapter;
        this.shader = opt.shader || null;
        this.transform = opt.transform || RenderObject.IDENTITY_MATRIX;
        this.visible = opt.visible !== undefined ? opt.visible : true;
        this.meshAdapter.renderObject = this;
        this.create();
    };

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.identity(XML3D.math.mat4.create());

    RenderObject.prototype.onmaterialChanged = function() {
        // console.log("Material changed");
    };

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
                var shaderAdapter = shaderHandle && shaderHandle.getAdapter();
                this.shader = shaderManager.createShader(shaderAdapter, lights);
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
            { name:'dataStructureChanged', from: ['NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoMesh' },
            { name:'dataValueChanged', from: ['Ready', 'DirtyMeshData'], to:'DirtyMeshData' },
            { name:'dispose', from:'*', to:'Disposed' }
        ]});

    // Export
    XML3D.webgl.RenderObject = RenderObject;
    XML3D.webgl.RenderObjectHandler = RenderObjectHandler;
}());
