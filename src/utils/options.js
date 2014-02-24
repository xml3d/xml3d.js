(function (ns) {


    /**
     *
     * @constructor
     */
    var Options = function (parent) {
        this._parent = parent;
        this._options = {};
        this._listeners = [];
    };

    Options.prototype = {
        register: function (key, defaultValue) {
            if (this._options.hasOwnProperty(key))
                throw new Error("Option already registered '" + key + "'");
            this._options[key] = defaultValue;
        },
        setValue: function (key, value) {
            if (!this._options.hasOwnProperty(key))
                throw new Error("Invalid configuration key '" + key + "'");
            this._options[key] = value;
            this.notifyObservers(key, value);
        },
        getValue: function (key) {
            if (!this._options.hasOwnProperty(key)) {
                if (this._parent) {
                    return this._parent.getValue();
                } else {
                    throw new Error("Invalid configuration key '" + key + "'");
                }
            }
            return this._options[key];
        },
        getKeys: function () {
            return Object.keys(this._options);
        },
        notifyObservers: function (key, value) {
            for (var i = 0; i < this._listeners.length; ++i) {
                this._listeners[i](key, value);
            }
        },
        addObserver: function (observer) {
            this._listeners.push(observer);
        },
        removeObserver: function (observer) {
            var idx = this._listeners.indexOf(observer);
            if (idx != -1)
                this._listeners.splice(idx, 1);
        }
    };

    var GlobalOptions = new Options(null);

    GlobalOptions.setOptionsFromQuery = function () {
        var p = window.location.search.substr(1).split('&');

        p.forEach(function (e) {
            var keyVal = e.split('=');
            try {
                var key = keyVal[0].toLowerCase();
                if (key.indexOf("xml3d-") === 0) {
                    var value = decodeURIComponent(keyVal[1]);
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Do nothing
                    }
                    XML3D.options.setValue(key.substr(6), value);
                }
            } catch (e) {
                XML3D.debug && XML3D.debug.logError(e);
            }
        });
    }

    ns.options = GlobalOptions;

}(XML3D));
