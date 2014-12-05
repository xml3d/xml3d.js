/**
 *
 * @constructor
 */
var DataChangeListener = function () {
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
