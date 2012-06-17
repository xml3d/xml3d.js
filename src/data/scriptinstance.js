// data/script.js

(function() {
    "use strict";
    var ScriptInstance = function(data, script) {
        this.data = data;
        this.script = script;
        this.result = {};
        this.needsEvaluation = true;
        this.outputListener = new Array();
        this.tables = new Array();

        this.getValue = function(name,cb) {
            if(this.needsEvaluation)
                this.evaluate();
            if(cb instanceof Function)
                cb();
            return this.result[name];
        };

        this.getTupleSize = function(name) {
            for(var i = 0; i < this.script.outputs.length; i++) {
                if(this.script.outputs[i].name == name)
                    return this.script.outputs[i].tupleSize;
            };
        };

        this.dataChanged = function(dataTable, entries) {
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
                	args.push(arg.getValue(XML3D._parallel));
                }
            });
            this.args = args;
            this.markOutputs(true);
            this.notifyTables();
            this.markOutputs(false);
        };

        this.evaluate = function() {
            this.result = null;
            this.result = {};
            try {
                var ok = false;
                if (XML3D._parallel) {
                    XML3D.debug.logDebug("Evaluate " + this.script.name + " on " + this.data.node.id + " using RiverTrail");
                    ok = this.script.evaluate_parallel.apply(this,this.args);
                } else {
                    XML3D.debug.logDebug("Evaluate " + this.script.name + " on " + this.data.node.id);
                    ok = this.script.evaluate.apply(this,this.args);
                }
                //console.dir(this.result);
            } catch (e) {
                XML3D.debug.logError("Failed to evaluate xflow script: " + e);
            }
            this.needsEvaluation = false;
        };

        this.registerOutput = function(output) {
            var length = this.outputListener.length;
            for(var i = 0; i < length; i++)
            {
                if(this.outputListener[i] == output)
                {
                    XML3D.debug.logWarning("Observer " + output + " is already registered");
                    return;
                }
            }
            this.outputListener.push(output);
            this.registerTable(output.table);
        };

        this.markOutputs = function(flag) {
            var length = this.outputListener.length;
            for(var i = 0; i < length; i++)
            {
                this.outputListener[i].dirty = flag;
            }
        };

        this.registerTable = function(table) {
            var length = this.tables.length;
            for(var i = 0; i < length; i++)
            {
                if(this.tables[i] == table)
                {
                    return;
                }
            }
            this.tables.push(table);
        };

        this.notifyTables = function() {
            var length = this.tables.length;
            for(var i = 0; i < length; i++)
            {
                this.tables[i].notifyDataChanged(this);
            }
        };

        // This script instance is a consumer itself
        //console.log("Creating Table for "+ this.script.name + " ScriptInstance of " + this.data.node.id);
        this.table = new XML3D.data.ProcessTable(this, this.script.params, this.dataChanged);
        this.data.requestInputData(this.table);
        //console.log("Table for "+ this.script.name + " ScriptInstance of " + this.data.node.id + ": ");
        //console.dir(this.table);
        this.table.close();

    };

    ScriptInstance.prototype.toString = function() {
        return "ScriptInstance("+this.data.node.id+"/"+this.script.name+")";
    };

    XML3D.data.ScriptInstance = ScriptInstance;
}());
