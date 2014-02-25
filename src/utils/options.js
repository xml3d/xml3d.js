(function (ns) {

    /**
     * Class to handle options. Currently only used for global options, could
     * be extended to work hierarchically to configure other elements.
     * @constructor
     */
    var Options = function () {
        this._options = {};
        this._listeners = { "*": [] };
    };

    Options.prototype = {
        register: function (key, defaultValue) {
            if (this._options.hasOwnProperty(key))
                throw new Error("Option already registered '" + key + "'");
            this._options[key] = {
                currentValue: defaultValue,
                defaultValue: defaultValue
            };
        },
        resetValue: function (key) {
            if (!this._options.hasOwnProperty(key))
                throw new Error("Invalid configuration key '" + key + "'");
            this._options[key].currentValue = this._options[key].defaultValue;
            this.notifyObservers(key, this._options[key].currentValue);
        },
        setValue: function (key, value) {
            if (!this._options.hasOwnProperty(key))
                throw new Error("Invalid configuration key '" + key + "'");
            this._options[key].currentValue = value;
            this.notifyObservers(key, value);
        },
        getValue: function (key) {
            if (!this._options.hasOwnProperty(key)) {
                throw new Error("Invalid configuration key '" + key + "'");
            }
            return this._options[key].currentValue;
        },
        getKeys: function () {
            return Object.keys(this._options);
        },
        notifyObservers: function (key, value) {
            // Notify specific observers
            if(this._listeners.hasOwnProperty(key)) {
                this._listeners[key].forEach(function(l) {
                   l(key, value);
                });
            }
            // Notify generic observers
            this._listeners["*"].forEach(function(l) {
               l(key, value);
            });
        },
        addObserver: function (key, observer) {
            if(typeof key == 'function') {
                observer = key;
                key = "*"
            }
            if(!this._options.hasOwnProperty(key) && key !== "*") {
                throw new Error("Can't register to unknown option '" + key + "'");
            }
            if(!this._listeners.hasOwnProperty(key)) {
                this._listeners[key] = [];
            }
            this._listeners[key].push(observer);
        },
        removeObserver: function (observer) {
            for(var filter in this._listeners) {
                var listeners = this._listeners[filter];
                var idx = listeners.indexOf(observer);
                if (idx != -1)
                    listeners.splice(idx, 1);
            }

        }
    };

    var GlobalOptions = new Options();

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
