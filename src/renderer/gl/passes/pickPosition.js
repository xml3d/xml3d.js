(function(webgl){

    var PickPositionRenderPass = function(context, opt) {
        webgl.BaseRenderPass.call(this, context, opt);
        this.program = context.programFactory.getPickingPositionProgram();
        this.objectBoundingBox = XML3D.math.bbox.create();
    };
    XML3D.createClass(PickPositionRenderPass, webgl.BaseRenderPass, {

        renderObject: (function() {

            var c_modelMatrix = XML3D.math.mat4.create();
            var c_modelViewProjectionMatrix = XML3D.math.mat4.create(),
                c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}},
                c_systemUniformNames = ["bbox", "modelMatrix", "modelViewProjectionMatrix"];

            return function(obj) {
                var gl = this.context.gl;

                this.target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);

                obj.getWorldMatrix(c_modelMatrix);

                obj.getObjectSpaceBoundingBox(this.objectBoundingBox);
                XML3D.math.bbox.transform(this.objectBoundingBox, c_modelMatrix, this.objectBoundingBox);

                this.program.bind();
                obj.getModelViewProjectionMatrix(c_modelViewProjectionMatrix);

                c_uniformCollection.sysBase["bbox"] = this.objectBoundingBox;
                c_uniformCollection.sysBase["modelMatrix"] = c_modelMatrix;
                c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_modelViewProjectionMatrix;

                this.program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
                obj.mesh.draw(this.program);

                this.program.unbind();
                this.target.unbind();
            };
        }()),

        readPositionFromPickingBuffer: (function() {

            var c_vec3 = XML3D.math.vec3.create();

            return function(x,y) {
                var data = this.readPixelDataFromBuffer(x, y);
                if(data){

                    c_vec3[0] = data[0] / 255;
                    c_vec3[1] = data[1] / 255;
                    c_vec3[2] = data[2] / 255;

                    var size = XML3D.math.bbox.size(XML3D.math.vec3.create(), this.objectBoundingBox);
                    size = XML3D.math.vec3.mul(size, c_vec3, size);
                    XML3D.math.vec3.add(size, this.objectBoundingBox, size);
                    return size;
                }
                else{
                    return null;
                }
            }
        }())
    });

    webgl.PickPositionRenderPass = PickPositionRenderPass;

}(XML3D.webgl));