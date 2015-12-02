var RenderAdapter = require("./base.js");
var Utils = require("../utils.js");
var Events = require("../../../interface/notification.js");
var dispatchCustomEvent = require("../../../utils/misc.js").dispatchCustomEvent;
var ResourceCounter = require("../../../resource/counter.js");

var XML3DRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this.fireLoadEventAfterDraw = false;
    this.firstLoadFired = false;
};
XML3D.createClass(XML3DRenderAdapter, RenderAdapter, {

    activeViewChanged: function () {
        var viewElement = getOrCreateActiveView(this.node);
        var adapter = this.factory.getAdapter(viewElement);
        this.factory.getScene().setActiveView(adapter.getRenderNode());
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        if (name == "view") {
            this.activeViewChanged();
        }
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.NODE_INSERTED:
                // This also initializes the children
                this.initElement(evt.mutation.target);
                return;
        }
    },


    /*
     * This function is called when scene DOM is loaded and all adapters are attached
     */
    onConfigured: function () {
        this.activeViewChanged();

        // emit load event when all resources currently loading are completed
        var callback = this.onLoadComplete.bind(this);
        // register callback for canvasId == 0 i.e. global resources
        ResourceCounter.addLoadCompleteListener(0, callback);
        // register callback for canvasId of this node
        ResourceCounter.addLoadCompleteListener(this.factory.canvasId, callback);
        this.onLoadComplete();
    },

    /* Interface methods */

    onLoadComplete: function (canvasId) {
        if (ResourceCounter.isLoadComplete(0) && ResourceCounter.isLoadComplete(this.factory.canvasId)) {
            this.fireLoadEventAfterDraw = true;
        }
    },

    onFrameDrawn: function () {
        if (this.fireLoadEventAfterDraw) {
            this.fireLoadEventAfterDraw = false;
            this.firstLoadFired = true;
            dispatchCustomEvent(this.node, 'load', false, true, null);
        }
    },


    getComplete: function () {
        if (this.fireLoadEventAfterDraw) return false;
        if (!this.firstLoadFired) return false;
        return ResourceCounter.isLoadComplete(0) && ResourceCounter.isLoadComplete(this.factory.canvasId);
    },

    getWorldBoundingBox: function () {
        var bbox = new XML3D.Box();
        Array.prototype.forEach.call(this.node.childNodes, function (c) {
            if (c.getWorldBoundingBox) {
                bbox.extend(c.getWorldBoundingBox());
            }
        });
        return bbox;
    }
})
;
//XML3D element is the root with no transform of its own so by definition it's always in world space
XML3DRenderAdapter.prototype.getLocalBoundingBox = XML3DRenderAdapter.prototype.getWorldBoundingBox;

/**
 *
 * @param {number} x x coordinate in screen space
 * @param {number} y y coordinate in screen space
 * @param {XML3D.Vec3?} hitPoint
 * @param {XML3D.Vec3?} hitNormal
 * @returns {*}
 */
XML3DRenderAdapter.prototype.getElementByPoint = function (x, y, hitPoint, hitNormal) {
    var relativeMousePos = Utils.convertPageCoords(this.node, x, y);

    var relX = relativeMousePos.x;
    var relY = relativeMousePos.y;

    var renderer = this.factory.getRenderer();
    var object = renderer.getRenderObjectFromPickingBuffer(relX, relY);
    if (object) {
        if (hitPoint) {
            var vec = renderer.getWorldSpacePositionByPoint(relX, relY, object);
            XML3D.math.vec3.copy(hitPoint.data, vec);
        }
        if (hitNormal) {
            var vec = renderer.getWorldSpaceNormalByPoint(relX, relY, object);
            XML3D.math.vec3.copy(hitNormal.data, vec);
        }
    } else {
        if (hitPoint) {
            hitPoint.x = NaN;
            hitPoint.y = NaN;
            hitPoint.z = NaN;
        }
        if (hitNormal) {
            hitNormal.x = NaN;
            hitNormal.y = NaN;
            hitNormal.z = NaN;
        }
    }
    return object ? object.node : null;
};

XML3DRenderAdapter.prototype.getRenderInterface = function () {
    return this.factory.getRenderer().getRenderInterface();
};

XML3DRenderAdapter.prototype.generateRay = function (x, y) {
    var relativeMousePos = Utils.convertPageCoords(this.node, x, y);
    return this.factory.getRenderer().generateRay(relativeMousePos.x, relativeMousePos.y);
};

XML3DRenderAdapter.prototype.getElementByRay = (function () {
    var c_viewMat = XML3D.math.mat4.create();
    var c_projMat = XML3D.math.mat4.create();

    return function (xml3dRay, hitPoint, hitNormal) {
        var renderer = this.factory.getRenderer();
        renderer.calculateMatricesForRay(xml3dRay, c_viewMat, c_projMat);
        var hitObject = renderer.getRenderObjectByRay(xml3dRay, c_viewMat, c_projMat);
        if (hitObject !== null && (hitPoint || hitNormal)) {
            if (hitPoint) {
                var vec = renderer.getWorldSpacePositionByRay(xml3dRay, hitObject, c_viewMat, c_projMat);
                XML3D.math.vec3.copy(hitPoint.data, vec);
            }
            if (hitNormal) {
                var vec = renderer.getWorldSpaceNormalByRay(xml3dRay, hitObject, c_viewMat, c_projMat);
                XML3D.math.vec3.copy(hitNormal.data, vec);
            }
        } else {
            if (hitPoint) {
                hitPoint.x = NaN;
                hitPoint.y = NaN;
                hitPoint.z = NaN;
            }
            if (hitNormal) {
                hitNormal.x = NaN;
                hitNormal.y = NaN;
                hitNormal.z = NaN;
            }
        }
        return hitObject !== null ? hitObject.node : null;
    }
})();


/**
 * Returns the active view element corresponding to the given xml3d element.
 *
 * @param {!Object} xml3d
 * @return {Object} the active view element
 */
function getOrCreateActiveView(xml3d) {
    // try to resolve reference
    var view = xml3d.querySelector(xml3d.view) || xml3d.querySelector("view");
    if (!view) {
        // didn't find any: create new one
        XML3D.debug.logWarning("xml3d element has no view defined: creating one.");

        view = xml3d.ownerDocument.createElement("view");
        xml3d.appendChild(view);
        xml3d.removeAttribute("view");
    }
    return view;
};

module.exports = XML3DRenderAdapter;


