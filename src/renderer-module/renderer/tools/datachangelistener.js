/**
 *
 * @constructor
 * @param {XML3D.webgl.Renderer} renderer
 */
var DataChangeListener = function (renderer) {
    Xflow.DataChangeNotifier.addListener(this.dataEntryChanged);
};

/**
 *
 * @param {Xflow.DataEntry} entry
 * @param {Xflow.DATA_ENTRY_STATE} notification
 */
DataChangeListener.prototype.dataEntryChanged = function (entry, notification) {
    if (entry.userData.webglData) {
        for (var i in entry.userData.webglData) {
            var oldChanged = entry.userData.webglData[i].changed;
            entry.userData.webglData[i].changed = Math.max(oldChanged, notification);
        }
    }
};

module.exports = DataChangeListener;
