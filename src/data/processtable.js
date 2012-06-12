XML3D.data = XML3D.data || {};

(function() {

    /**
     * ProviderEntry is an interface for entries in the ProcessTable
     * @constructor
     */
    var ProviderEntry = function(table) {
        this.consumers = new Array();
        this.table = table;
    };
    ProviderEntry.prototype.getValue = function() {
    };
    ProviderEntry.prototype.getTupleSize = function() {
    };
    /**
     * @param consumer
     */
    ProviderEntry.prototype.registerConsumer = function(consumer) {
        var length = this.consumers.length;
        for ( var i = 0; i < length; i++) {
            if (this.consumers[i] == consumer) {
                XML3D.debug.logWarning("Consumer " + consumer + " is already registered");
                return;
            }
        }
        this.consumers.push(consumer);
    };

    ProviderEntry.prototype.notifyTable = function() {
        this.table.notifyDataChanged();
    };

    /**
     * @param consumer
     */
    ProviderEntry.prototype.unregisterConsumer = function(consumer) {
        var length = this.consumers.length;
        for ( var i = 0; i < length; i++) {
            if (this.consumers[i] == consumer) {
                this.consumers.splice(i,1);
                return;
            }
        }
        XML3D.debug.logWarning("Consumer " + consumer + " has never been registered");
    };

    ProviderEntry.prototype.notifyDataChanged = function(e) {
        var length = this.consumers.length;
        for ( var i = 0; i < length; i++) {
            this.consumers[i].notifyDataChanged(this);
        }
    };

    /**
     * @constructor
     * @extends ProviderEntry
     */
    var Sequence = function(entry1, entry2) {
        ProviderEntry.call(this);
        this.data = [];

        this.push = function(entry) {
            var key = entry.key;
            if (key === undefined)
                throw "No key in entry for sequence";
            var length = this.data.length;
            for ( var i = 0; i < length; i++) {
                if (this.data[i].key == key) {
                    this.data.splice(i, 1, entry);
                    return;
                }
            }
            this.data.push(entry);
            this.data.sort(function(a, b) {
                return a.key - b.key;
            });
        };

        this.interpolate = function(t, interp) {
            if (t <= this.data[0].key)
                return this.data[0].value;
            if (t >= this.data[this.data.length - 1])
                return this.data[this.data.length - 1].value;
            for ( var i = 0; i < this.data.length - 1; ++i)
                if (this.data[i].key < t && t <= this.data[i + 1].key) {
                    return interp(this.data[i].value, this.data[i + 1].value, (t - this.data[i].key) / (this.data[i + 1].key - this.data[i].key));
                }
        };

        this.getValue = function() {
            return this;
        };

        this.push(entry1);
        this.push(entry2);
    };
    XML3D.createClass(Sequence, ProviderEntry);

    /**
     * @constructor
     */
    var ProcessTable = function(handler, names, callback) {
        this.handler = handler;
        this.fieldNames = names;
        this.cb = callback;
        /**
         * Contains named ProviderEntries
         * @type {Object.<string, ProviderEntry>}
         */
        this.providers = {};

        this.setFieldNames = function(names) {
            this.fieldNames = names;
            this.providers = null;
            this.providers = {};
            this.open();
        };

        this.open = function() {
            for ( var a in this.providers) {
                this.providers[a].unregisterConsumer(this);
            }
        };

        this.register = function() {
            for ( var a in this.providers) {
                this.providers[a].registerConsumer(this);
            }

        };

        this.close = function() {
            this.register();
            this.notifyDataChanged();
        };

        this.notifyDataChanged = function(provider) {
            if (this.cb)
                this.cb.call(this.handler, this.providers, provider);
        };

        this.toString = function() {
            var result = "ProcessTable(";
            result += this.fieldNames.join(" ");
            result += ")";
            return result;
        };
    };

    /**
     * Class ScriptOutput is a single, named output of a script.
     * It's the entry in the provider map of a ProcessTable
     *
     * @constructor
     * @extends ProviderEntry
     */
    var ScriptOutput = function(table, script, name) {
        ProviderEntry.call(this, table);
        this.script = script;
        this.name = name;
        this.data = {}; // Attached user data
        this.script.registerOutput(this);

        this.getValue = function(cb) {
            return this.script.getValue(this.name, cb);
        };

        this.getTupleSize = function() {
            return this.script.getTupleSize(this.name);
        };

        this.toString = function() {
            return this.name + ": " + this.script.toString();
        };
    };
    XML3D.createClass(ScriptOutput, ProviderEntry);

    // Exports
    XML3D.data['ProcessTable'] = ProcessTable;
    XML3D.data['ScriptOutput'] = ScriptOutput;
    XML3D.data['Sequence'] = Sequence;
    XML3D.data['ProviderEntry'] = ProviderEntry;

}());