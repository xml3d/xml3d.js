var RenderAdapter = require("./base.js");
var Utils = require("../utils.js");
var Events = require("../../../interface/notification.js");
var dispatchCustomEvent = require("../../../utils/misc.js").dispatchCustomEvent;
var getOrCreateActiveView = require("../../../utils/misc.js").getOrCreateActiveView;

var XML3DRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this.fireLoadEventAfterDraw = false;
    this.firstLoadFired = false;
};
XML3D.createClass(XML3DRenderAdapter, RenderAdapter);

XML3D.extend(XML3DRenderAdapter.prototype, {
    updateActiveViewAdapter: function () {
        var href = this.node.getAttribute("activeView");
        if (href) {
            this.connectAdapterHandle("activeView", this.getAdapterHandle(href));
        } else {
            this.disconnectAdapterHandle("activeView");
        }
    }, setViewAdapter: function (adapter) {
        adapter = adapter || this.getConnectedAdapter("activeView");
        if (!(adapter && adapter.getRenderNode)) {
            var viewElement = getOrCreateActiveView(this.node);
            adapter = this.factory.getAdapter(viewElement);
        }
        this.factory.getScene().setActiveView(adapter.getRenderNode());
    }, dispose: function () {
        this.clearAdapterHandles();
    }
});

XML3DRenderAdapter.prototype.notifyChanged = function (evt) {

    switch (evt.type) {
        case Events.ADAPTER_HANDLE_CHANGED:
            this.setViewAdapter(evt.adapter);
            return;
        case Events.NODE_INSERTED:
            // This also initializes the children
            this.initElement(evt.mutation.target);
            return;
        case Events.NODE_REMOVED:
            // Handled in removed node
            return;
    }

    var target = evt.mutation.attributeName;
    if (target && (target.toLowerCase() === "activeview")) {
        this.updateActiveViewAdapter();
        this.setViewAdapter();
    }
};

/* Interface methods */

/*
 * This function is called when scene DOM is loaded and all adapters are attached
 */
XML3DRenderAdapter.prototype.onConfigured = function () {
    this.updateActiveViewAdapter();
    this.setViewAdapter();

    // emit load event when all resources currently loading are completed
    var callback = this.onLoadComplete.bind(this);
    // register callback for canvasId == 0 i.e. global resources
    XML3D.base.resourceManager.addLoadCompleteListener(0, callback);
    // register callback for canvasId of this node
    XML3D.base.resourceManager.addLoadCompleteListener(this.factory.canvasId, callback);
    this.onLoadComplete();
};

XML3DRenderAdapter.prototype.onLoadComplete = function (canvasId) {
    if (XML3D.base.resourceManager.isLoadComplete(0) && XML3D.base.resourceManager.isLoadComplete(this.factory.canvasId)) {
        this.fireLoadEventAfterDraw = true;
    }
};

XML3DRenderAdapter.prototype.onFrameDrawn = function () {
    if (this.fireLoadEventAfterDraw) {
        this.fireLoadEventAfterDraw = false;
        this.firstLoadFired = true;
        dispatchCustomEvent(this.node, 'load', false, true, null);
    }
};


XML3DRenderAdapter.prototype.getComplete = function () {
    if (this.fireLoadEventAfterDraw) return false;
    if (!this.firstLoadFired) return false;
    return XML3D.base.resourceManager.isLoadComplete(0) && XML3D.base.resourceManager.isLoadComplete(this.factory.canvasId);
};

XML3DRenderAdapter.prototype.getWorldBoundingBox = function () {
    var bbox = new window.XML3DBox();
    Array.prototype.forEach.call(this.node.childNodes, function (c) {
        if (c.getWorldBoundingBox)
            bbox.extend(c.getWorldBoundingBox());
    });
    return bbox;
};
//XML3D element is the root with no transform of its own so by definition it's always in world space
XML3DRenderAdapter.prototype.getLocalBoundingBox = XML3DRenderAdapter.prototype.getWorldBoundingBox;

XML3DRenderAdapter.prototype.getElementByPoint = function (x, y, hitPoint, hitNormal) {
    var relativeMousePos = Utils.convertPageCoords(this.node, x, y);

    var relX = relativeMousePos.x;
    var relY = relativeMousePos.y;

    var renderer = this.factory.getRenderer();
    var object = renderer.getRenderObjectFromPickingBuffer(relX, relY);
    if (object) {
        if (hitPoint) {
            var vec = renderer.getWorldSpacePositionByPoint(relX, relY, object);
            hitPoint.set(vec[0], vec[1], vec[2]);
        }
        if (hitNormal) {
            var vec = renderer.getWorldSpaceNormalByPoint(relX, relY, object);
            hitNormal.set(vec[0], vec[1], vec[2]);
        }
    } else {
        if (hitPoint) hitPoint.set(NaN, NaN, NaN);
        if (hitNormal) hitNormal.set(NaN, NaN, NaN);
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
                hitPoint.set(vec[0], vec[1], vec[2]);
            }
            if (hitNormal) {
                var vec = renderer.getWorldSpaceNormalByRay(xml3dRay, hitObject, c_viewMat, c_projMat);
                hitNormal.set(vec[0], vec[1], vec[2]);
            }
        } else {
            if (hitPoint) hitPoint.set(NaN, NaN, NaN);
            if (hitNormal) hitNormal.set(NaN, NaN, NaN);
        }
        return hitObject !== null ? hitObject.node : null;
    }
})();

module.exports = XML3DRenderAdapter;


