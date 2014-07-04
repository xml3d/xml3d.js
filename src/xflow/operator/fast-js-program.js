(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.OperatorList
//----------------------------------------------------------------------------------------------------------------------

    Xflow.FastJsProgram = function(operatorList){
        this.func = createFastJsProgram(operatorList);
    }

    Xflow.FastJsProgram.prototype.run = function(programData){
        /*
        var operatorData = prepareOperatorData(this.list, 0, programData);

        if(this.operator.evaluate_core){
            applyCoreOperation(this, programData, operatorData);
        }
        else{
            applyDefaultOperation(this.entry, programData, operatorData);
        }
        */
    }

    function createFastJsProgram(operatorList){
        var snippetList = Xflow.shadejs.convertOperatorListToSnippets(operatorList);
        var systemParams = {
            "type": "object",
            "kind": "any",
            "info": {}
        };

        var result = Shade.compileJsProgram(snippetList, systemParams, true);
        var func = eval("(" + result.code + ")");
        return func;
    }

}());