(function(webgl){

    /** @const */
    var BBOX_ANNOTATION_FILTER = ["boundingBox"];

    /**
     * A RenderMesh is a RenderObject with some mesh-specific behaviors.
     * It handles all primitive types also known by GL: triangles, lines, points, etc.
     * @param {Scene} scene
     * @param {Object} pageEntry
     * @param {Object} opt
     * @constructor
     */
    var RenderMesh = function(scene, pageEntry, opt) {
        webgl.RenderObject.call(this, scene, pageEntry, opt);

        /**
         * Can we take an annotated bounding box or do we have to
         * calculate it from the drawable?
         * @type {boolean}
         */
        this.boundingBoxAnnotated = false;

        if (this.object.data) {
            // Bounding Box annotated
            this.annotatedBoundingBoxRequest = new Xflow.ComputeRequest(this.object.data, BBOX_ANNOTATION_FILTER, this.boundingBoxAnnotationChanged.bind(this));
            this.boundingBoxAnnotationChanged(this.annotatedBoundingBoxRequest);
        }
    };
    // No additional entries for RenderMeshes
    RenderMesh.ENTRY_SIZE = webgl.RenderObject.ENTRY_SIZE;


    XML3D.createClass(RenderMesh, webgl.RenderObject, {
        boundingBoxAnnotationChanged: function(request){
            var result = request.getResult();
            var bboxData = result.getOutputData(BBOX_ANNOTATION_FILTER[0]);
            if(bboxData) {
                var bboxVal = bboxData.getValue();
                this.setObjectSpaceBoundingBox(bboxVal);
                this.boundingBoxAnnotated = true;
            } else {
                this.boundingBoxAnnotated = false;
            }
            this.drawable.setBoundingBoxRequired(!this.boundingBoxAnnotated);
        }
    });

    // Export
    webgl.RenderMesh = RenderMesh;


}(XML3D.webgl));
