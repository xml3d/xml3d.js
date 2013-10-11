(function (ns) {

    var ObjectSorter = function () {

    };

    var c_bbox = XML3D.math.bbox.create();
    var c_center = XML3D.math.vec3.create();

    XML3D.extend(ObjectSorter.prototype, {
        /**
         * @param {GLScene} scene
         * @param {Float32Array?} viewMatrix Matrix to apply to objects world space extend before sorting
         */
        sortScene: function (scene, viewMatrix) {
            var sourceObjectArray = scene.ready,
                firstOpaque = scene.firstOpaqueIndex,
                opaque = [],
                transparent = [];

            var tempArray = [], obj;
            for (var i = 0, l = sourceObjectArray.length; i < l; i++) {
                obj = sourceObjectArray[i];
                if (obj.inFrustum === false) {
                    continue;
                }
                if (i < firstOpaque) {
                    tempArray.push(obj);
                } else {
                    var program = obj.getProgram();
                    opaque[program.id] = opaque[program.id] || [];
                    opaque[program.id].push(obj);
                }
            }

            //Sort transparent objects from back to front
            var tlength = tempArray.length;
            if (tlength > 1) {
                for (i = 0; i < tlength; i++) {
                    obj = tempArray[i];
                    obj.getWorldSpaceBoundingBox(c_bbox);
                    XML3D.math.bbox.center(c_center, c_bbox);
                    viewMatrix && XML3D.math.vec3.transformMat4(c_center, c_center, viewMatrix);
                    tempArray[i] = [ obj, c_center[2] ];
                }

                tempArray.sort(function (a, b) {
                    return a[1] - b[1];
                });

                for (i = 0; i < tlength; i++) {
                    transparent[i] = tempArray[i][0];
                }
            } else if (tlength == 1) {
                transparent[0] = tempArray[0];
            }
            return {
                opaque: opaque,
                transparent: transparent
            }
        }

    });


    ns.ObjectSorter = ObjectSorter;

}(XML3D.webgl));
