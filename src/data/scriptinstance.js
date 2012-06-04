// data/script.js

(function() {
    "use strict";
    var ScriptInstance = function(data, script) {
        this.data = data;
        this.script = script;
        this.result = {};
        this.needsEvaluation = true;
        this.observers = new Array();


        this.getValue = function(name,cb) {
            if(this.needsEvaluation)
                this.evaluate();
            if(cb)
                cb();
            return this.result[name];
        };

        this.getTupleSize = function(name) {
            for(var i = 0; i < this.script.outputs.length; i++) {
                if(this.script.outputs[i].name == name)
                    return this.script.outputs[i].tupleSize;
            };
        };

        this.dataChanged = function(dataTable, entry) {
            this.needsEvaluation = true;
            var args = [];
            this.script.params.forEach(function(param){
                var arg = dataTable[param];
                if (!arg) {
                    XML3D.debug.logInfo("Missing input in xflow script: " + param);
                    args.push(undefined);
                }
                else {
                    //console.log("Add argument " + param + ": " + arg);
                    args.push(arg.getValue());
                }
            });
            this.args = args;
            this.notifyConsumers();
        };

        this.evaluate = function() {
            this.result = {};
            try {
                XML3D.debug.logDebug("Evaluate " + this.script.name + " on " + this.data.node.id);
                var ok = false;
                if (XML3D._parallel) {
                    ok = this.script.evaluate_parallel.apply(this.result,this.args);
                } else {
                    ok = this.script.evaluate.apply(this.result,this.args);
                }
                //console.dir(this.result);
            } catch (e) {
                XML3D.debug.logError("Failed to evaluate xflow script: " + e);
            }
            this.needsEvaluation = false;
        };

        this.registerConsumer = function(consumer) {
            var length = this.observers.length;
            for(var i = 0; i < length; i++)
            {
                if(this.observers[i] == consumer)
                {
                    XML3D.debug.logWarning("Observer " + consumer + " is already registered");
                    return;
                }
            }
            this.observers.push(consumer);
        };

        this.notifyConsumers = function() {
            var length = this.observers.length;
            for(var i = 0; i < length; i++)
            {
                this.observers[i].notifyDataChanged(this);
            }
        };

        // This script instance is a consumer itself
        //console.log("Creating Table for "+ this.script.name + " ScriptInstance of " + this.data.node.id);
        this.table = new XML3D.data.ProcessTable(this, this.script.params, this.dataChanged);
        this.data.requestInputData(this, this.script.params, this.table, this.dataChanged);
        //console.log("Table for "+ this.script.name + " ScriptInstance of " + this.data.node.id + ": ");
        //console.dir(this.table);
        this.table.register();

    };

    ScriptInstance.prototype.toString = function() {
        return "ScriptInstance("+this.data.node.id+"/"+this.script.name+")";
    };

    XML3D.data.ScriptInstance = ScriptInstance;
}());
