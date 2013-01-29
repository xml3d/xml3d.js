// box.js
(function($) {
    // Is native?
    if($) return;

    var c_XflowObserverList = [];

    var XflowObserver = function(callback){
        this.callback = callback;
        this.observed = [];
    }

    XflowObserver.prototype.observe = function(node, options){
        if(this.observed.length == 0)
            c_XflowObserverList.push(this);
        var dataAdapter = XML3D.data.factory.getAdapter(node);
        if(dataAdapter){

            var entry = {
                node: node,
                changed: false,
                request: null
            };

            var names = options['names'];
            var typeOfNames = Object.prototype.toString.call(names).slice(8, -1);
            if (typeOfNames === "String") {
                names = [names];
            }

            entry.request = dataAdapter.getComputeRequest(names, function(request, changeType){
                entry.changed = true;
            });
            // Fetch result to synchronize Xflow structures and connect to callbacks
            // TODO: Find an option to connect request to callback structure without computing result
            entry.request.getResult();

            this.observed.push(entry);
        }

    }

    XflowObserver.prototype.disconnect = function(){
        for(var i = 0; i < this.observed.length; ++i){
            this.observed[i].request.clear();
        }
        this.observed = [];
        var i = c_XflowObserverList.length;
        while(i--){
            if(c_XflowObserverList[i] == this)
                c_XflowObserverList.splice(i, 1);
        }
    }

    var XflowRecord = function(target, result){
        this.target = target;
        this.result = result;
    }

    window.XflowObserver = XflowObserver;
    window.XflowRecord = XflowRecord;

    XML3D.updateXflowObserver = function(){
        for(var i = 0; i < c_XflowObserverList.length; ++i){
            var observer = c_XflowObserverList[i];
            var records = [];
            for(var j = 0; j < observer.observed.length; ++j){
                var entry = observer.observed[j];
                if(entry.changed){
                    entry.changed = false;
                    var result = entry.request.getResult();

                    var values = {};
                    for (var name in result._dataEntries) {
                        var data = result.getOutputData(name) && result.getOutputData(name).getValue();
                        if (data)
                            values[name] = data;
                    }
                    records.push( new XflowRecord(entry.node, values));
                }
            }
            if(records.length > 0 && observer.callback){
                observer.callback(records, observer);
            }
        }
    }

}(XML3D._native));
