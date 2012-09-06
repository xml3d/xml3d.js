XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function() {
    var eventTypes = {onclick:1, ondblclick:1,
            ondrop:1, ondragenter:1, ondragleave:1};

    var noDrawableObject = function() {
        XML3D.debug.logError("Mesh adapter has no callback to its mesh object!");
    },
    /**
     * @type WebGLRenderingContext
     * @private
     */
    rc = window.WebGLRenderingContext;

    var staticAttributes = ["index", "position", "normal", "color", "texcoord", "size", "tangent"];

    /**
     * @constructor
     */
    var XML3DMeshRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);

        this.processListeners();
        this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
        this.parentVisible = true;
        this.getMyDrawableObject = noDrawableObject;

        this.computeRequest = null;
    };

    XML3D.createClass(XML3DMeshRenderAdapter, XML3D.webgl.RenderAdapter);

    var p = XML3DMeshRenderAdapter.prototype;

    /**
     *
     */
    p.processListeners  = function() {
        var attributes = this.node.attributes;
        for (var index in attributes) {
            var att = attributes[index];
            if (!att.name)
                continue;

            var type = att.name;
            if (type.match(/onmouse/) || eventTypes[type]) {
                var eventType = type.substring(2);
                this.node.addEventListener(eventType,  new Function("evt", att.value), false);
            }
        }
    };

    /**
     * @param {Function} callback
     */
    p.registerCallback = function(callback) {
        if (callback instanceof Function)
            this.getMyDrawableObject = callback;
    };

    /**
     * @param {XML3D.events.Notification} evt
     */
    p.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.NODE_INSERTED)
            // Node insertion is handled by the CanvasRenderAdapter
            return;
        else if (evt.type == XML3D.events.NODE_REMOVED)
            return this.factory.renderer.sceneTreeRemoval(evt);

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        switch (target) {
            case "parenttransform":
                this.getMyDrawableObject().transform = evt.newValue;
                break;

            case "parentshader":
                var newShaderId = evt.newValue ? evt.newValue.node.id : "defaultShader";
                this.getMyDrawableObject().shader = newShaderId;
                break;

            case "parentvisible":
                this.getMyDrawableObject().visible = evt.newValue && this.node.visible;
                break;

            case "visible":
                this.getMyDrawableObject().visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
                break;

            case "src":
                this.createMesh();
                break;

            case "type":
                var newGLType = this.getGLTypeFromString(evt.wrapped.newValue);
                this.getMyDrawableObject().mesh.glType = newGLType;
                break;

            default:
                XML3D.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '"+target+"'");
                break;
        }

    };

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} type
     * @param {Object} data
     */
    var createBuffer = function(gl, type, data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

    /**
     *
     */
    p.createMesh = function() {
        var that = this;
        this.computeRequest = this.dataAdapter.getComputeRequest(staticAttributes,
            function(request, changeType) {
                that.dataChanged(request, changeType);
        });
        this.dataChanged();
    };

    var emptyFunction = function() {};

    /**
     * @param {string} type
     */
    function createMeshInfo(type) {
        return {
            vbos : {},
            isIndexed: false,
            glType: getGLTypeFromString(type),
            bbox : new window.XML3DBox(),
            update : emptyFunction
        };
    }

    /**
     * @param {Xflow.data.Request} request
     * @param {Xflow.RequestNotification} changeType
     */
    p.dataChanged = function(request, changeType) {
        var obj = this.getMyDrawableObject();
        obj.mesh = obj.mesh || createMeshInfo(this.node.type);
        if (obj.mesh.update === emptyFunction) {
            var that = this;
            obj.mesh.update = function() {
                that.updateData.call(that, obj);
                obj.mesh.update = emptyFunction;
            };
            this.factory.renderer.requestRedraw("Mesh data changed.", false);
        };
    };

    /**
     * @param {Renderer.drawableObject} obj
     */
    p.updateData = function(request, changeType) {
        var gl = this.factory.renderer.gl;
        var obj = this.getMyDrawableObject();
        var calculateBBox = false;
        var meshInfo = obj.mesh || createMeshInfo(this.node.type);

        var dataResult =  this.computeRequest.getResult();

        if (!(dataResult.getOutputData("position"))) {
            XML3D.debug.logInfo("Mesh " + this.node.id + " has no data for required attribute 'position'.");
            obj.mesh.valid = false;
            return;
        }
        for ( var i in staticAttributes) {
            var attr = staticAttributes[i];
            var entry = dataResult.getOutputData(attr);
            if (!entry)
                continue;

            var buffer = entry.userData.buffer;

            switch(entry.userData.webglDataChanged) {
            case Xflow.DataNotifications.CHANGED_CONTENT:
                var bufferType = attr == "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                gl.bindBuffer(bufferType, buffer);
                gl.bufferSubData(bufferType, 0, entry.getValue());
                break;
            case Xflow.DataNotifications.CHANGED_NEW:
            case Xflow.DataNotifications.CHANGE_SIZE:
                if (attr == "index") {
                    buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                } else {
                    buffer = createBuffer(gl, gl.ARRAY_BUFFER, entry.getValue());
                }
                buffer.tupleSize = entry.getTupleSize();
                entry.userData.buffer = buffer;
                break;
             default:
                 break;
            }

            meshInfo.vbos[attr] = [];
            meshInfo.vbos[attr][0] = buffer;

            //TODO: must set isIndexed if indices are removed
            if (attr == "position")
                calculateBBox = true;
            if (attr == "index")
                meshInfo.isIndexed = true;

            delete entry.userData.webglDataChanged;
        }

        //Calculate a bounding box for the mesh
        if (calculateBBox) {
            var positions = dataResult.getOutputData("position").getValue();
            this.bbox = XML3D.webgl.calculateBoundingBox(positions, meshInfo.isIndexed ? dataResult.getOutputData("index").getValue() : null);
            meshInfo.bbox.set(this.bbox);
        }

        meshInfo.valid = true;
        obj.mesh = meshInfo;
    };

    /**
     *
     */
    p.destroy = function() {
        if (this.getMyDrawableObject == noDrawableObject) {
            return; //This mesh either has no GL data or was already deleted
        }
        this.dataChanged();
        this.factory.renderer.removeDrawableObject(this.getMyDrawableObject());
        this.getMyDrawableObject = noDrawableObject;
    };

    /**
     * @return {XML3DBox}
     */
    p.getBoundingBox = function() {
        return this.bbox;
    };

    var getGLTypeFromArray = function(array) {
        if (array instanceof Int8Array)
            return rc.BYTE;
        if (array instanceof Uint8Array)
            return rc.UNSIGNED_BYTE;
        if (array instanceof Int16Array)
            return rc.SHORT;
        if (array instanceof Uint16Array)
            return rc.UNSIGNED_SHORT;
        if (array instanceof Int32Array)
            return rc.INT;
        if (array instanceof Uint32Array)
            return rc.UNSIGNED_INT;
        if (array instanceof Float32Array)
            return rc.FLOAT;
        return rc.FLOAT;
    };

    /**
     * @param {string} typeName
     */
    function getGLTypeFromString(typeName) {
        if (typeName && typeName.toLowerCase)
            typeName = typeName.toLowerCase();
        switch (typeName) {
        case "triangles":
            return rc.TRIANGLES;
        case "tristrips":
            return rc.TRIANGLE_STRIP;
        case "points":
            return rc.POINTS;
        case "lines":
            return rc.LINES;
        case "linestrips":
            return rc.LINE_STRIP;
        default:
            return rc.TRIANGLES;
        }
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.XML3DMeshRenderAdapter = XML3DMeshRenderAdapter;

}());