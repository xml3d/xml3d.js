// methods.js
XML3D.methods = XML3D.methods || {};

new (function() {

    var methods = {};

    methods.xml3dCreateXML3DVec3 = function() {
        return new window.XML3DVec3();
    };

    methods.xml3dCreateXML3DRay = function() {
        return new window.XML3DRay();
    };

    methods.xml3dGetElementByRay = function(ray, hitPoint, hitNormal) {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getElementByRay) {
                return adapters[adapter].getElementByRay(ray, hitPoint, hitNormal);
            }
        }
        return null;
    };

    methods.xml3dCreateXML3DMatrix = function() {
        return new window.XML3DMatrix();
    };

    methods.xml3dCreateXML3DRotation = function() {
        return new window.XML3DRotation();
    };

    methods.viewGetDirection = function() {
        return this.orientation.rotateVec3(new window.XML3DVec3(0, 0, -1));
    };

    methods.viewSetPosition = function(pos) {
        this.position = pos;
    };

    var tmpX = XML3D.math.vec3.create();
    var tmpY = XML3D.math.vec3.create();
    var tmpZ = XML3D.math.vec3.create();

    XML3D.math.quat.setFromMat3 = function(m, dest) {
        var tr = m[0] + m[4] + m[8];

        if (tr > 0) {
            var s = Math.sqrt(tr + 1.0) * 2; // s=4*dest[3]
            dest[0] = (m[7] - m[5]) / s;
            dest[1] = (m[2] - m[6]) / s;
            dest[2] = (m[3] - m[1]) / s;
            dest[3] = 0.25 * s;
        } else if ((m[0] > m[4]) & (m[0] > m[8])) {
            var s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2; // s=4*qx
            dest[3] = (m[7] - m[5]) / s;
            dest[0] = 0.25 * s;
            dest[1] = (m[1] + m[3]) / s;
            dest[2] = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            var s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2; // s=4*qy
            dest[3] = (m[2] - m[6]) / s;
            dest[0] = (m[1] + m[3]) / s;
            dest[1] = 0.25 * s;
            dest[2] = (m[5] + m[7]) / s;
        } else {
            var s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2; // s=4*qz
            dest[3] = (m[3] - m[1]) / s;
            dest[0] = (m[2] + m[6]) / s;
            dest[1] = (m[5] + m[7]) / s;
            dest[2] = 0.25 * s;
        }
    };

    XML3D.math.quat.setFromBasis = function(X,Y,Z,dest) {
        var lx = 1.0 / XML3D.math.vec3.length(X);
        var ly = 1.0 / XML3D.math.vec3.length(Y);
        var lz = 1.0 / XML3D.math.vec3.length(Z);
        var m = XML3D.math.mat3.create();
        m[0] = X[0] * lx;
        m[1] = Y[0] * ly;
        m[2] = Z[0] * lz;
        m[3] = X[1] * lx;
        m[4] = Y[1] * ly;
        m[5] = Z[1] * lz;
        m[6] = X[2] * lx;
        m[7] = Y[2] * ly;
        m[8] = Z[2] * lz;
        XML3D.math.quat.setFromMat3(m,dest);
    };

    methods.viewSetDirection = function(direction) {
        direction = direction || new window.XML3DVec3(0,0,-1);
        direction = direction.normalize();

        var up = this.orientation.rotateVec3(new window.XML3DVec3(0,1,0));
        up = up.normalize();

        XML3D.math.vec3.cross(tmpX,direction._data,up._data);
        if(!XML3D.math.vec3.length(tmpX)) {
                tmpX = this.orientation.rotateVec3(new window.XML3DVec3(1,0,0))._data;
        }
        XML3D.math.vec3.cross(tmpY,tmpX,direction._data);
        XML3D.math.vec3.negate(tmpZ,direction._data);

        var q = XML3D.math.quat.create();
        XML3D.math.quat.setFromBasis(tmpX, tmpY, tmpZ, q);
        this.orientation._setQuaternion(q);
    };

    methods.viewSetUpVector = function(up) {
        up = up || new window.XML3DVec3(0,1,0);
        up = up.normalize();

        var r = new window.XML3DRotation();
        r.setRotation(new window.XML3DVec3(0,1,0),up);
        r = this.orientation.multiply(r);
        r = r.normalize();
        this.orientation.set(r);
    };

    methods.viewGetUpVector = function() {
        return this.orientation.rotateVec3(new window.XML3DVec3(0, 1, 0));
    };

    methods.viewLookAt = function(point) {
        this.setDirection(point.subtract(this.position));
    };

    methods.viewGetViewMatrix = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].getViewMatrix) {
                return adapters[adapter].getViewMatrix();
            }
        }
        // Fallback implementation
        var p = this.position;
        var r = this.orientation;
        var a = r.axis;
        return new window.XML3DMatrix().translate(p.x, p.y, p.z).rotateAxisAngle(a.x, a.y, a.z, r.angle).inverse();
    };

    methods.xml3dGetElementByPoint = function(x, y, hitPoint, hitNormal) {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getElementByPoint) {
                return adapters[adapter].getElementByPoint(x, y, hitPoint, hitNormal);
            }
        }
        return null;
    };

    methods.xml3dGenerateRay = function(x, y) {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].generateRay) {
                return adapters[adapter].generateRay(x, y);
            }
        }
        return new window.XML3DRay();
    };

    methods.groupGetLocalMatrix = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].getLocalMatrix) {
                return adapters[adapter].getLocalMatrix();
            }
        }
        return new window.XML3DMatrix();
    };

    /**
     * return the bounding box that is the bounding box of all children.
     */
    methods.groupGetBoundingBox = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getBoundingBox) {
                return adapters[adapter].getBoundingBox();
            }
        }
        return new window.XML3DBox();
    };
    methods.xml3dGetBoundingBox = methods.groupGetBoundingBox;

    methods.meshSetWorldSpaceBoundingBox = function(bboxNew) {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].setWorldSpaceBoundingBox) {
                adapters[adapter].setWorldSpaceBoundingBox(bboxNew);
            }
        }
    }
    methods.groupSetWorldSpaceBoundingBox = methods.meshSetWorldSpaceBoundingBox;

    /**
     * returns the bounding box of this mesh in world space.
     */
    methods.meshGetBoundingBox = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getBoundingBox) {
                return adapters[adapter].getBoundingBox();
            }
        }
        return new window.XML3DBox();
    };

    methods.xml3dGetRenderInterface = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].getRenderInterface) {
                return adapters[adapter].getRenderInterface();
            }
        }
        return {};
    };


    methods.XML3DGraphTypeGetWorldMatrix = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getWorldMatrix) {
                return adapters[adapter].getWorldMatrix();
            }
        }
        return new window.XML3DMatrix();
    };

    methods.videoPlay = function() {
        XML3D.base.sendAdapterEvent(this, {play: []});
    };

    methods.videoPause = function() {
        XML3D.base.sendAdapterEvent(this, {pause: []});
    };

    methods.XML3DNestedDataContainerTypeGetOutputNames =
    methods.XML3DShaderProviderTypeGetOutputNames =
    methods.meshGetOutputNames = function() {
        var dataAdapter = XML3D.base.resourceManager.getAdapter(this, XML3D.data);
        if(dataAdapter){
            return dataAdapter.getOutputNames();
        }
        return null;
    };

    methods.XML3DNestedDataContainerTypeGetResult =
    methods.XML3DShaderProviderTypeGetResult =
    methods.meshGetResult = function(filter) {

        var dataAdapter = XML3D.base.resourceManager.getAdapter(this, XML3D.data);
        if(dataAdapter){
            var result = dataAdapter.getComputeResult(filter);
            if(!result) return null;
            return new window.XML3DDataResult(result);
        }
        return null;
    };

    methods.XML3DNestedDataContainerTypeGetOutputChannelInfo =
    methods.XML3DShaderProviderTypeGetOutputChannelInfo =
    methods.meshGetOutputChannelInfo = function(name){
        var dataAdapter = XML3D.base.resourceManager.getAdapter(this, XML3D.data);
        if(dataAdapter){
            var result = dataAdapter.getOutputChannelInfo(name);
            if(!result) return null;
            return new window.XML3DDataChannelInfo(result.type, result.origin, result.originalName,
                result.seqLength, result.seqMinKey, result.seqMaxKey);
        }
        return null;
    }

    methods.XML3DNestedDataContainerTypeGetComputeInfo =
    methods.XML3DShaderProviderTypeGetComputeInfo =
    methods.meshGetComputeInfo = function(){
        XML3D.debug.logError(this.nodeName + "::getComputeInfo is not implemeted yet.");
        return null;
    }

    methods.XML3DNestedDataContainerTypeGetProtoInfo =
    methods.XML3DShaderProviderTypeGetProtoInfo =
    methods.meshGetProtoInfo = function(){
        XML3D.debug.logError(this.nodeName + "::getProtoInfo is not implemeted yet.");
        return null;
    }

    methods.XML3DNestedDataContainerTypeIsOutputConnected =
    methods.XML3DShaderProviderTypeIsOutputConnected =
    methods.meshIsOutputConnected = function(){
        XML3D.debug.logError(this.nodeName + "::isOutputConnected is not implemeted yet.");
        return false;
    }


    function createValues(result, names) {
        var values = {};
        for (var i in names) {
            var name = names[i];
            var data = result.getOutputData(name) && result.getOutputData(name).getValue();
            if (data)
                values[name] = data;
        }
        return values;
    };

    /** Register data listener for data fields specified by names.
     *
     * @param names   single name or array of names that are monitored.
     * @param callback function that is called when selected data are changed.
     * @return {Boolean}
     */
    methods.dataAddOutputFieldListener = function(names, callback) {
        if (!names)
            return false;

        // check if names is a single string, and convert it to array then
        var typeOfNames = Object.prototype.toString.call(names).slice(8, -1);
        if (typeOfNames === "String") {
            names = [names];
        }
        if (names.length == 0)
            return false;

        var request = XML3D.base.callAdapterFunc(this, {
            getComputeRequest : [names, function(request, changeType) {
                callback(createValues(request.getResult(), names));
            }
            ]});
        if (request.length == 0)
            return false;
        var result = request[0].getResult();
        var values = createValues(result, names);
        if (Object.keys(values).length)
            callback(values);
        return true;
    };

    XML3D.scriptValueLabel = "[value set by script]";


    methods.XML3DDataSourceTypeSetScriptValue = function(data){
        var configData = this._configured;

        if(!configData)
            return;

        if(this.textContent != XML3D.scriptValueLabel)
            this.textContent = XML3D.scriptValueLabel;
        configData.scriptValue = data;

        var dataAdapter = XML3D.base.resourceManager.getAdapter(this, XML3D.data);
        if(dataAdapter)
            dataAdapter.setScriptValue(data);


    };

    // Export to xml3d namespace
    XML3D.extend(XML3D.methods, methods);
});
