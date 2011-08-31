
// Adapter for <xml3d>
org.xml3d.webgl.XML3DCanvasRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.canvas = factory.handler.canvas;
};
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DCanvasRenderAdapter;

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.eventType == MutationEvent.ADDITION) {
		this.factory.renderer.sceneTreeAddition(evt);
	} else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
	}
	if (evt.attribute == "activeView") {
		this.factory.renderer.camera = this.factory.renderer.initCamera();
	}
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.addEventListener = function(type, listener, useCapture) {
	this.factory.handler.addEventListener(this.node, type, listener, useCapture);
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.removeEventListener = function(type, listener, useCapture) {
	this.factory.handler.removeEventListener(this.node, type, listener, useCapture);
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) {
	var pickY = this.factory.handler.getCanvasHeight() - y - 1; 
		this.factory.handler.renderPick(x, pickY);
		if(hitPoint && this.node.currentPickPos)
		{
			hitPoint.x = this.node.currentPickPos.v[0]; 
			hitPoint.y = this.node.currentPickPos.v[1]; 
			hitPoint.z = this.node.currentPickPos.v[2]; 
		}
		
		if(hitNormal && this.node.currentPickObj)
		{
			this.factory.handler.renderPickedNormals(this.node.currentPickObj, x, pickY);
			hitNormal.x = this.node.currentPickNormal.v[0];
			hitNormal.y = this.node.currentPickNormal.v[1]; 
			hitNormal.z = this.node.currentPickNormal.v[2]; 
		}
		
		if(this.node.currentPickObj !== null)
			return this.node.currentPickObj.node;
		else
			return null; 
};

org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.generateRay = function(x, y) {
	
	var glY = this.factory.handler.getCanvasHeight() - y - 1; 
	return this.factory.handler.generateRay(x, glY); 		
}; 