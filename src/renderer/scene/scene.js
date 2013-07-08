(function(webgl) {

    var PAGE_SIZE = 1<<12;

    var StateMachine = window.StateMachine;

    var Scene = function() {

        this.pages = [];
        this.nextOffset = 0;
        this.firstOpaqueIndex = 0;
        this.boundingBox = {min : [0,0,0], max : [0,0,0]};
        this.lights = {
            changed : true,
            structureChanged : true,
            point: { length: 0, intensity: [], position: [], attenuation: [], visibility: [] },
            directional: { length: 0, intensity: [], direction: [], visibility: [] },
            spot: { length: 0, intensity: [], direction: [], attenuation: [], visibility: [], position: [], falloffAngle: [], softness: [] }
        };
        this.activeView = null;

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
        };
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
        };
        this.forEach = function(func, that) {
            this.queue.slice().forEach(func, that);
            this.ready.slice().forEach(func, that);
        };

        this.addPage = function() {
            var page = new Float32Array(PAGE_SIZE);
            this.pages.push(page);
            this.nextOffset = 0;
            XML3D.debug.logInfo("adding page", this.pages.length, page.length);
        };
        this.createPageEntry = function(size) {
            if(!size)
                throw new Error("No size given for page entry");
            if (this.nextOffset + size > PAGE_SIZE) {
                this.addPage();
                this.createPageEntry(size);
                return;
            }
            var page = this.pages[this.pages.length-1];
            var localOffset = this.nextOffset;
            this.nextOffset += size;
            var result = { page: page, offset : localOffset};
            return result;
        };

        this.createRenderObject = function(opt) {
            var pageEntry = this.createPageEntry(webgl.RenderObject.ENTRY_SIZE);
            var renderObject = new webgl.RenderObject(this, pageEntry, opt);
            this.queue.push(renderObject);
            return renderObject;
        };

        this.createRenderGroup = function(opt) {
            var pageEntry = this.createPageEntry(webgl.RenderGroup.ENTRY_SIZE);
            return new webgl.RenderGroup(this, pageEntry, opt);
        };

        this.createRenderView = function(opt) {
            var pageEntry = this.createPageEntry(webgl.RenderView.ENTRY_SIZE);
            return new webgl.RenderView(this, pageEntry, opt);
        };

        this.createRenderLight = function(opt) {
            var pageEntry = this.createPageEntry(webgl.RenderLight.ENTRY_SIZE);
            this.addLightDataOffsetToPageEntry(pageEntry, opt.lightType);
            this.lights.structureChanged = true;
            return new webgl.RenderLight(this, pageEntry, opt);
        };

        this.addLightDataOffsetToPageEntry = function(pageEntry, lightType) {
            var lightObj = this.lights[lightType];
            pageEntry.lightOffset = lightObj.length++;
        };

        this.createRootNode = function() {
            var pageEntry = this.createPageEntry(webgl.RenderGroup.ENTRY_SIZE);
            var root = new webgl.RenderGroup(this, pageEntry, {});
            root.setWorldMatrix(XML3D.math.mat4.create());
            root.transformDirty = false;
            root.shaderDirty = false;
            root.visible = true;
            root.shaderHandle = new XML3D.base.AdapterHandle("not_found");
            root.shaderHandle.status = XML3D.base.AdapterHandle.STATUS.NOT_FOUND;
            this.rootNode = root;
            return root;
        };

        this.updateBoundingBox = function() {
            this.rootNode.getWorldSpaceBoundingBox(this.boundingBox.min, this.boundingBox.max);
        };

        this.getBoundingBox = function(min, max) {
            XML3D.math.vec3.copy(min, this.boundingBox.min);
            XML3D.math.vec3.copy(max, this.boundingBox.max);
        };

        this.addPage();
        this.rootNode = this.createRootNode();
        this.clear();

    };
    Scene.PAGE_SIZE = PAGE_SIZE;


    window.StateMachine.create({
        target:XML3D.webgl.RenderObject.prototype,
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

    webgl.Scene = Scene;

})(XML3D.webgl);
