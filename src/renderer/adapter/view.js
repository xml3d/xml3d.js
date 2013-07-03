// Adapter for <view>
(function() {
    var ViewRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);
        this.zFar = 100000;
        this.zNear = 0.1;
        this.parentTransform = null;
        this.viewMatrix = XML3D.math.mat4.create();
        this.projMatrix = null;
        this.worldPosition = [0,0,0];
        this.updateViewMatrix();
        this.createRenderNode();
    };
    XML3D.createClass(ViewRenderAdapter, XML3D.webgl.TransformableAdapter);
    var p = ViewRenderAdapter.prototype;

    var tmp = XML3D.math.mat4.create(),
        tmp2 = XML3D.math.mat4.create();

    p.createRenderNode = function() {
        // Create renderNode
    };

    p.updateViewMatrix = function() {
        // Create local matrix
        var pos = this.node.position._data;
        var orient = this.node.orientation.toMatrix()._data;

        // tmp = T
        XML3D.math.mat4.identity(tmp);
        tmp[12] = pos[0];
        tmp[13] = pos[1];
        tmp[14] = pos[2];

        // tmp = T * O
        XML3D.math.mat4.multiply(tmp, tmp, orient);

        var p = this.factory.getAdapter(this.node.parentNode);
        this.parentTransform = p.applyTransformMatrix(XML3D.math.mat4.identity(tmp2));

        if (this.parentTransform) {
            XML3D.math.mat4.multiply(tmp, this.parentTransform, tmp);
        }
        this.worldPosition = [tmp[12], tmp[13], tmp[14]];
        XML3D.math.mat4.copy(this.viewMatrix, XML3D.math.mat4.invert(tmp, tmp));

        connectProjectionAdapater(this);
    };

    p.getProjectionMatrix = function(aspect) {
        if (this.projMatrix == null) {
            var adapter = this.getConnectedAdapter("perspective");
            if(adapter){
                this.projMatrix = adapter.getMatrix("perspective");
            }
            else{
                var fovy = this.node.fieldOfView;
                var zfar = this.zFar;
                var znear = this.zNear;
                var f = 1 / Math.tan(fovy / 2);
                this.projMatrix = XML3D.math.mat4.copy(XML3D.math.mat4.create(), [ f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), -1, 0, 0,
                    2 * znear * zfar / (znear - zfar), 0 ]);

            }
        }
        return this.projMatrix;
    };

    /* Interface method */
    p.getViewMatrix = function() {
        var m = new window.XML3DMatrix();
        m._data.set(this.viewMatrix);
        return m;
    };

    /**
     * @return {XML3DMatrix} returns the inverse of the view matrix, since now we
     * want to go world2view and not view2world
     */
    p.getWorldMatrix = function() {
        var m = new window.XML3DMatrix();
        var tmp = XML3D.math.mat4.create();
        XML3D.math.mat4.invert(tmp, this.viewMatrix);
        m._data.set(tmp);
        return m;
    };


    p.getModelViewMatrix = function(model) {
        return XML3D.math.mat4.multiply(XML3D.math.mat4.create(), this.viewMatrix, model);
    };

    p.getModelViewProjectionMatrix = function(modelViewMatrix) {
        return XML3D.math.mat4.multiply(XML3D.math.mat4.create(), this.projMatrix, modelViewMatrix);
    };

    p.getWorldSpacePosition = function() {
        return this.worldPosition;
    };

    p.notifyChanged = function(evt) {

        if( (evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED) && !evt.internalType){
            // The connected transform node changed;
            this.projMatrix = null;
        }
        else{
            var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

            switch (target) {
                case "parenttransform":
                    this.parentTransform = evt.newValue;
                    this.updateViewMatrix();
                    break;

                case "orientation":
                case "position":
                    this.updateViewMatrix();
                    break;
                case "perspective":
                case "fieldOfView":
                    connectProjectionAdapater(this);
                    this.projMatrix = null;
                    break;

                default:
                    XML3D.debug.logWarning("Unhandled event in view adapter for parameter " + target);
                    break;
            }
        }

        this.factory.handler.redraw("View changed");
    };

    function connectProjectionAdapater(adapter){
        var href = adapter.node.getAttribute("perspective");
        if(href){
            adapter.connectAdapterHandle("perspective", adapter.getAdapterHandle(href));
        }
        else{
            adapter.disconnectAdapterHandle("perspective");
        }

    }


    // Export to XML3D.webgl namespace
    XML3D.webgl.ViewRenderAdapter = ViewRenderAdapter;

}());
