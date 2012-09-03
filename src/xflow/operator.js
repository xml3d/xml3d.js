(function(){

    var operators = {};

    Xflow.registerOperator = function(name, data){
        var actualName = "xflow." + name;
        operators[actualName] = data;
        data.name = actualName;
    };

    Xflow.getOperator = function(name){
        return operators[name];
    };

    var DataNode = Xflow.DataNode;

    DataNode.prototype._applyOperator = function(input){
        if(!this._operatorData)
            this._operatorData = {
                result: {},
                outputs: {}
            }
        var operator = Xflow.getOperator(this._computeOperator);
        if(operator){
            // prepare input:
            var args = [];
            for(var i in operator.params){
                var inputName = operator.params[i];
                var dataName = this._computeInputMapping.getScriptInputName(i, inputName);
                if(dataName){
                    var channel = input[dataName];
                    args.push(channel ? channel.getDataEntry().getValue() : null);
                }
                else
                    args.push(null);
            }

            operator.evaluate.apply(this._operatorData, args);

            var outputs = this._operatorData.outputs;
            for(var i in operator.outputs){
                var d = operator.outputs[i];
                var value = this._operatorData.result[d.name];
                if(!outputs[d.name])
                    outputs[d.name] = new Xflow.Channel(this);

                var entry = outputs[d.name].getDataEntry();
                if(!entry){
                    switch(d.tupleSize*1){
                        case 1: entry = new Xflow.BufferEntry(Xflow.DataEntry.TYPE.FLOAT, value); break;
                        case 2: entry = new Xflow.BufferEntry(Xflow.DataEntry.TYPE.FLOAT2, value); break;
                        case 3: entry = new Xflow.BufferEntry(Xflow.DataEntry.TYPE.FLOAT3, value); break;
                        case 4: entry = new Xflow.BufferEntry(Xflow.DataEntry.TYPE.FLOAT4, value); break;
                        case 16: entry = new Xflow.BufferEntry(Xflow.DataEntry.TYPE.FLOAT4X4, value); break;
                    }
                    outputs[d.name].addDataEntry(entry, 0);
                }
                else{
                    entry.setValue(value);
                }
            }
            this._computeOutputMapping.applyScriptOutputOnMap(input, outputs);
        }
    }

})();