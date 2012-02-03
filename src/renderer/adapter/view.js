// Adapter for <view>
(function() {

    var targets = {};

    targets["internal:transform"] = function(evt) {
        this.parentTransform = evt.newValue;
        this.updateViewMatrix();
    };
    targets["orientation"] = targets["position"] = function() {
        this.updateViewMatrix();
    };
    targets["fieldOfView"] = function() {
        this.projMatrix = null;
    };

    var XML3DViewRenderAdapter = function(factory, node) {
        xml3d.webgl.RenderAdapter.call(this, factory, node);
        this.zFar = 100000;
        this.zNear = 0.1;
        this.viewMatrix = null;
        this.projMatrix = null;
        this._parentTransform = null;
        this.updateViewMatrix();
    };
    xml3d.createClass(XML3DViewRenderAdapter, xml3d.webgl.RenderAdapter);

    XML3DViewRenderAdapter.prototype.updateViewMatrix = function() {
            var pos = this.node.position._data;
            var orient = this.node.orientation;
            var v = mat4.rotate(mat4.translate(mat4.identity(mat4.create()), pos), orient.angle, orient.axis._data);

            var p = this.factory.getAdapter(this.node.parentNode);
            this.parentTransform = p.applyTransformMatrix(mat4.identity(mat4.create()));
            // console.log(mat4.str(this.parentTransform));
            if (this.parentTransform) {
                v = mat4.multiply(this.parentTransform, v);
            }
            this.viewMatrix = mat4.inverse(v);
    };

    XML3DViewRenderAdapter.prototype.getProjectionMatrix = function(aspect) {
        if (this.projMatrix == null) {
            var fovy = this.node.fieldOfView;
            var zfar = this.zFar;
            var znear = this.zNear;
            var f = 1 / Math.tan(fovy / 2);
            this.projMatrix = mat4.create([ f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), -1, 0, 0,
                    2 * znear * zfar / (znear - zfar), 0 ]);
        }
        return this.projMatrix;
    };

    XML3DViewRenderAdapter.prototype.getModelViewMatrix = function(model) {
        return mat4.multiply(this.viewMatrix, model, mat4.create());
    };

    XML3DViewRenderAdapter.prototype.getNormalMatrix = function(modelViewMatrix) {
        var invt = mat4.inverse(modelViewMatrix, mat4.create());
        return mat4.toMat3(invt);
    };

    XML3DViewRenderAdapter.prototype.getModelViewProjectionMatrix = function(modelViewMatrix) {
        return mat4.multiply(this.projMatrix, modelViewMatrix, mat4.create());
    };

    XML3DViewRenderAdapter.prototype.notifyChanged = function(evt) {
        var target = evt.attrName || "internal:" + evt.type;

        if (targets[target]) {
            targets[target].call(this, evt);
        } else {
            xml3d.debug.logWarning("Unhandled event in group adapter: " + evt.eventType + " for parameter " + target);
        }

        this.factory.handler.redraw("View changed");
    };

    // Export to xml3d.webgl namespace
    xml3d.webgl.XML3DViewRenderAdapter = XML3DViewRenderAdapter;

}());
