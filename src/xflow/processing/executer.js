(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Executer
//----------------------------------------------------------------------------------------------------------------------

    Xflow.Executer = function(ownerNode){

        this.mergedNodes = [];
        this.subNodes = [];
        this.unprocessedDataNames = [];

        this.scriptList = null;
        this.programData = null;
        this.program = null;

        constructExecutor(this, ownerNode);
    }

    Xflow.Executer.prototype.run = function(){
        // TODO: Implement
    }

    Xflow.Executer.prototype.getVertexShader = function(){
        // TODO: Implement
    }


    function constructExecuter(executer, ownerNode){
        var constructData = {
            blockedNodes: [],
            constructionOrder: [],
            inputSlot: {},
            operatorOutput: {},


        }
    }



})();