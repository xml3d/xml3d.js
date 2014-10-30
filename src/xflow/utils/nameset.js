(function(){



Xflow.utils = {};


Xflow.utils.set = {};


Xflow.utils.set.add = function(setArray, setToAdd){
    if(Array.isArray(setToAdd)){
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
Xflow.utils.set.remove = function(setArray, setToRemove){
    var idx;
    if(Array.isArray(setToRemove)){
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

Xflow.utils.set.intersection = function(dest, setA, setB){
    var size = setA.length;
    for(var i = 0; i < size; ++i){
        if(setB.indexOf(setA[i]) != -1)
            dest.push(setA[i]);
    }
}

Xflow.utils.set.isIntersecting = function(setA, setB){
    var i = setA.length;
    while(i--){
        if(setB.indexOf(setA[i]) != -1)
            return true;
    }
    return false;
}

Xflow.utils.set.isSubset = function(smallerSet, largerSet){
    var i = smallerSet.length;
    while(i--){
        if(largerSet.indexOf(smallerSet[i]) == -1)
            return false;
    }
    return true;
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
    var i = nameSetA.length;
    while(i--){
        if(nameSetB.indexOf(nameSetA[i]) == -1){
            nameSetA.splice(i,1);
        }
    }
}


Xflow.utils.binarySearch = function(keys, key, maxIndex){
    var min = 0, max = maxIndex - 1;
    while(min <= max){
        var i = Math.floor((min + max) / 2);
        if(keys[i] == key){
            return i;
        }
        else if(keys[i] < key)
            min = i + 1;
        else
            max = i - 1;
    }
    return max;
}


})();
