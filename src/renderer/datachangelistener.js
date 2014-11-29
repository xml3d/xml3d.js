
/**
 *
 * @constructor
 * @param {XML3D.webgl.Renderer} renderer
 */
XML3D.webgl.DataChangeListener = function(renderer) {
    this.requestRedraw = renderer.requestRedraw;
    Xflow.DataChangeNotifier.addListener(this.dataEntryChanged);
};

/**
 *
 * @param {Xflow.DataEntry} entry
 * @param {Xflow.DATA_ENTRY_STATE} notification
 */
XML3D.webgl.DataChangeListener.prototype.dataEntryChanged = function(entry, notification) {
    if(entry.userData.webglData){
        for(var i in entry.userData.webglData){
            var oldChanged = entry.userData.webglData[i].changed;
            entry.userData.webglData[i].changed = Math.max(oldChanged, notification);
        }
    }

    //TODO: Decide if we need a picking buffer redraw too
    //this.requestRedraw("Data changed", false);
};
