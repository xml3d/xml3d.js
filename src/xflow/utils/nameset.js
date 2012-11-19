(function(){



Xflow.utils = {};


Xflow.utils.setAdd = function(setArray, setToAdd){
    if(setToAdd.length !== undefined){
        for(var i = 0; i < setToAdd.length; ++i){
            if(setArray.indexOf(setToAdd[i]) == -1)
                setArray.push(setToAdd[i]);
        }
    }
    else{
        if(setArray.indexOf(setToAdd) == -1)
            setArray.push(setToAdd);
    }
}
Xflow.utils.setRemove = function(setArray, setToRemove){
    var idx;
    if(setToRemove.length !== undefined){
        for(var i = 0; i < setToRemove.length; ++i){
            if( (idx = setArray.indexOf(setToRemove[i])) != -1)
                setArray.splice(idx,1);
        }
    }
    else{
        if( (idx = setArray.indexOf(setToRemove)) != -1)
            setArray.splice(idx,1);
    }
}

/**
 * Nameset Utilities for Xflow
 */
Xflow.nameset = {};

Xflow.nameset.add = function(nameSet, toAdd){
    if(!toAdd) return;
    if(typeof toAdd == "string"){
        if(nameSet.indexOf(toAdd) == -1)
            nameSet.push(toAdd);
    }
    else{
        for(var i = 0; i < toAdd.length; ++i){
            if(nameSet.indexOf(toAdd[i]) == -1)
                nameSet.push(toAdd[i]);
        }
    }
}

Xflow.nameset.remove = function(nameSet, toRemove){
    if(!toRemove) return;
    if(typeof toRemove == "string"){
        var removeIdx = nameSet.indexOf(toRemove);
        if(removeIdx != -1)
            nameSet.splice(removeIdx, 1);
    }
    else{
        for(var i = 0; i < toRemove.length; ++i){
            var removeIdx = nameSet.indexOf(toRemove[i]);
            if(removeIdx != -1)
                nameSet.splice(removeIdx, 1);
        }
    }
}

Xflow.nameset.intersection = function(nameSetA, nameSetB){
    var result = [];
    var i = nameSetA.length;
    while(i--){
        if(nameSetB.indexOf(nameSetA[i]) == -1){
            nameSetA.splice(i,1);
        }
    }
}



})();