(function () {
    "use strict";

    Xflow.CLProgram = function (operatorList) {
        this.cl = operatorList.graph.cl;
        console.log("CLProgram:",this.cl);

        if(!this.cl) {
            return;
        }

        this.list = operatorList;
        this.entry = operatorList.entries[0];
        this.operator = this.entry.operator;
        this._inlineLoop = null;
    };

    Xflow.CLProgram.prototype.run = function (programData) {
        var operatorData = prepareOperatorData(this.list, 0, programData);

        applyDefaultOperation(this.entry, programData, operatorData);

    };

    function applyDefaultOperation(entry, programData, operatorData) {
        var args = assembleFunctionArgs(entry, programData);
        args.push(operatorData);

        //Temporary fallback to old style evaluation before WebCL operators are fully implemented
        if(typeof entry.operator.evaluate === "function") {
            entry.operator.evaluate.apply(operatorData, args);
        } else {
            console.log("Starting WebCL operator:", entry.operator.name);
        }
    }

    function prepareOperatorData(list, idx, programData) {
        var doIterate, i;
        var data = programData.operatorData[0];
        var entry = list.entries[idx];
        var mapping = entry.operator.mapping;

        data.iterFlag = {};

        for (i = 0; i < mapping.length; ++i) {
            doIterate = (entry.isTransferInput(i) || list.isInputIterate(entry.getDirectInputIndex(i)));
            data.iterFlag[i] = doIterate;
        }

        data.iterateCount = list.getIterateCount(programData);

        return data;
    }

    function assembleFunctionArgs(entry, programData) {
        var d, dataEntry, i;
        var args = [];
        var outputs = entry.operator.outputs;

        for (i = 0; i < outputs.length; ++i) {
            d = outputs[i];
            dataEntry = programData.outputs[entry.getOutputIndex(i)].dataEntry;
            args.push(dataEntry ? dataEntry.getValue() : null);
        }

        addInputToArgs(args, entry, programData);

        return args;
    }

    function addInputToArgs(args, entry, programData) {
        var mapEntry, dataEntry, i;
        var mapping = entry.operator.mapping;

        for (i = 0; i < mapping.length; ++i) {
            mapEntry = mapping[i];
            dataEntry = programData.getDataEntry(entry.getDirectInputIndex(i));
            args.push(dataEntry ? dataEntry.getValue() : null);
        }
    }

    function prepareWebCLKernel () {

    }

    function prepareWebCLProgram () {

    }

}());