var assert = require("assert");

// Error Callbacks:
var c_errorCallbacks = [];

var c_listedCallbacks = [];
var c_listedCallbacksData = [];

module.exports = {

    registerErrorCallback: function (callback) {
        c_errorCallbacks.push(callback);
    },

    notifyError: function (message, node) {
        if (c_errorCallbacks.length > 0) {
            var i;
            for (i = 0; i < c_errorCallbacks.length; ++i) {
                c_errorCallbacks[i](message, node);
            }
        } else {
            // TODO: Do Default error printing
        }
    },

    /**
     *
     * @param {Object} ctor Constructor
     * @param {Object} parent Parent class
     * @param {Object=} methods Methods to add to the class
     * @returns {Object}
     */
    createClass: function (ctor, parent, methods) {
        methods = methods || {};
        if (parent) {
            /** @constructor */
            var F = function () {
            };
            F.prototype = parent.prototype;
            ctor.prototype = new F();
            ctor.prototype.constructor = ctor;
            ctor.superclass = parent.prototype;
        }
        for (var m in methods) {
            ctor.prototype[m] = methods[m];
        }
        return ctor;
    },

    extend: function (a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
    },

    /**
     * Cluster internal notifications to avoid multiple notifications
     * of same type. Mainly for Requests and Results
     *
     * @param requestOrResult Request or Result
     * @param {RESULT_STATE} resultState
     * @private
     */
    _queueResultCallback: function (requestOrResult, resultState) {
        assert(resultState !== undefined);
        var index;
        if (( index = c_listedCallbacks.indexOf(requestOrResult)) == -1) {
            index = c_listedCallbacks.length;
            c_listedCallbacks.push(requestOrResult);
        }
        var prevData = c_listedCallbacksData[index];

        if (!prevData || prevData < resultState) {
            c_listedCallbacksData[index] = resultState;
        }
    },

    _flushResultCallbacks: function () {
        if (c_listedCallbacks.length) {
            var i;
            for (i = 0; i < c_listedCallbacks.length; ++i) {
                c_listedCallbacks[i]._onPostponedResultChanged(c_listedCallbacksData[i]);
            }
            c_listedCallbacks = [];
            c_listedCallbacksData = [];
        }
    }
};






