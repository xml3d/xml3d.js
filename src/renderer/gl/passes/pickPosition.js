(function(webgl){

    var PickPositionRenderPass = function(context, opt) {
        webgl.BaseRenderPass.call(this, context, opt);
        this.program = context.programFactory.getPickingPositionProgram();
    };
    XML3D.createClass(PickPositionRenderPass, webgl.BaseRenderPass, {

        renderObject: (function() {

            var c_modelMatrix = XML3D.math.mat4.create();
            var c_modelViewProjectionMatrix = XML3D.math.mat4.create();

            return function(obj) {
                var gl = this.context.gl;

                this.target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);

                obj.getWorldMatrix(c_modelMatrix);
                this.bbMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
                this.bbMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];

                var objBB = new XML3D.webgl.BoundingBox();
                obj.getObjectSpaceBoundingBox(objBB.min, objBB.max);
                XML3D.webgl.adjustMinMax(objBB, this.bbMin, this.bbMax, c_modelMatrix);

                this.program.bind();
                obj.getModelViewProjectionMatrix(c_modelViewProjectionMatrix);

                var parameters = {
                    bbMin : this.bbMin,
                    bbMax : this.bbMax,
                    modelMatrix : c_modelMatrix,
                    modelViewProjectionMatrix : c_modelViewProjectionMatrix
                };

                this.program.setUniformVariables(parameters);
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

                    // TODO: Optimize (2 float arrays created)
                    var result = XML3D.math.vec3.subtract(XML3D.math.vec3.create(), this.bbMax, this.bbMin);
                    result = XML3D.math.vec3.fromValues(c_vec3[0]*result[0], c_vec3[1]*result[1], c_vec3[2]*result[2]);
                    XML3D.math.vec3.add(result, this.bbMin, result);

                    return result;
                }
                else{
                    return null;
                }
            }
        }())
    });

    webgl.PickPositionRenderPass = PickPositionRenderPass;

}(XML3D.webgl));