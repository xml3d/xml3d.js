var XflowIP = {};

(function() {

    var c_worker = null;
    var c_nodes = [];
    var c_initialized = false;
    var c_domLoaded = false;
    var c_observer = null;


    /** Load Xflow module to extend functionality
     * @param workerUrl Url of worker file
     * @param addOns Array of urls for modules to load
     **/
    XflowIP.init = function(workerUrl, addOns){
        c_worker = new Worker(workerUrl);
        c_worker.onmessage = onMessage;
        c_worker.postMessage({
            'type' : 'initialize',
            'addons' : addOns
        });
    }

    function onDomLoaded(){
        c_domLoaded = true;
        addStyleTag();
        if(c_initialized){
            parseDocument();
        }
    }

    function addStyleTag(){
        var style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.innerHTML = "xflowip { display: none;}\n" +
                "xflowimg * { display: none;}";
        document.head.appendChild(style);
    }

    function onMessage(event){
        var data = event.data;
        var type = data['type'];
        switch(type){
            case 'initialized':
                c_initialized = true;
                if(c_domLoaded){
                    parseDocument();
                }
                break;
            case 'loadImage':
                var url = data['url'];
                var id = data['id'];
                var img = new Image();
                img.onload = function(){
                    var data = createImageData(img);
                    c_worker.postMessage({ 'type' : 'imageLoaded' ,
                        'id' : id, 'imageData': data });
                }
                img.src = url;
                break;
            case 'updateSinkImage':
                updateSinkImage(data['id'], data['imageData']);
                break;
            case 'log':
                XflowIP.log("Worker: " + event.data['msg']);
                break;
            case 'warning':
                XflowIP.warning("Worker: " + event.data['msg']);
                break;
            case 'error':
                XflowIP.error("Worker: " + event.data['msg']);
                break;
            default: XflowIP.error("Unknown Message Type: '" + type + "'");
        }
    }

    function onDomChange(records){
        for(var i = 0; i < records.length; ++i){
            var record = records[i];
            var node = record.target;
            if(node.nodeType == 3) node = node.parentNode;

            switch(record.type){
                case "attributes" :
                    c_worker.postMessage({
                        'type' : 'updateAttribute',
                        'id' : node._xflowip.id,
                        'attrName' : record.attributeName,
                        'attrValue' : node.getAttribute(record.attributeName)
                    });
                    break;
                case "characterData" :
                    c_worker.postMessage({
                        'type' : 'updateValue',
                        'id' : node._xflowip.id,
                        'value' : getNodeValue(node)
                    })
                    break;
                case "childList" :
                    break;
                default: XflowIP.error("Unknown Mutation Type: '" + record.type + "'");
            }
        }
    }

    var MutationObserver = (window.MutationObserver || window.WebKitMutationObserver ||
        window.MozMutationObserver);

    c_observer = new MutationObserver(onDomChange);


    function parseDocument(){
        XflowIP.log("Start Parsing!");
        var xflowips = document.querySelectorAll("xflowip");
        for(var i = 0; i < xflowips.length; ++i){
            initNode(xflowips[i]);
        }

        var xflowimg = document.querySelectorAll("xflowimg");
        for(var i = 0; i < xflowimg.length; ++i){
            initSinkNode(xflowimg[i]);
        }
        XflowIP.log("End Parsing!");
    }


    function initNode(node){
        var configData = node._xflowip = {};
        configData.id = c_nodes.length;
        c_nodes.push(node);

        var nodeData = getNodeData(node);
        c_worker.postMessage({ 'type' : 'createNode' , 'nodeData' : nodeData });

        c_observer.observe(node, {attributes: true,childList: true});
        var k = node.firstChild;
        while(k){
            if(k.nodeType == 3)
                c_observer.observe(k, {characterData: true});
            k = k.nextSibling;
        }

        initNodeChildren(node);
    }

    function initSinkNode(node){
        initNode(node);

        var canvas = document.createElement("canvas");
        var hideDiv = document.createElement("div");
        hideDiv.style.display = 'none';
        node.parentNode.insertBefore(canvas, node);
        node.parentNode.insertBefore(hideDiv, node);
        hideDiv.appendChild(node);
        syncCanvasStyle(node, canvas);

        node._xflowip.canvas = canvas;
    }

    function syncCanvasStyle(node, canvas){
        var cStyle = window.getComputedStyle(node);
        var originalStyle = window.getComputedStyle(canvas);
        for(var i in cStyle){
            if(isNaN(i) && i != "cssText"){
                var newValue = cStyle[i] && cStyle[i].replace && cStyle[i].replace("0px", "0");
                var oldValue = originalStyle[i] && originalStyle[i].replace && originalStyle[i].replace("0px", "0");
                if(newValue != oldValue)
                    canvas.style[i] = cStyle[i];
            }
        }
    }

    function getNodeData(node){
        var nodeData = {
            "id" : node._xflowip.id,
            "tagName" : node.tagName.toLowerCase(),
            "attribs" : {},
            "value" : {}
        }
        for (var i=0, attrs=node.attributes, l=attrs.length; i<l; i++){
            nodeData["attribs"][attrs.item(i).nodeName] = attrs.item(i).nodeValue;
        }

        nodeData["value"] = getNodeValue(node);
        return nodeData;
    }

    function getNodeValue(node){
        var value = "";
        var k = node.firstChild;
        while (k) {
            value += k.nodeType == 3 ? k.textContent : " ";
            k = k.nextSibling;
        }
        return value;
    }

    function initNodeChildren(node){
        var k = node.firstChild;
        while (k) {
            if(k.nodeType != 3){
                initNode(k);
                if(k._xflowip){
                    c_worker.postMessage({ 'type' : 'connectNodes' ,
                        'parent' : node._xflowip.id,
                        'child' : k._xflowip.id });
                }
            }
            k = k.nextSibling;
        }
    }

    var c_canvas = document.createElement("canvas");
    function createImageData(img){
        c_canvas.width = img.width;
        c_canvas.height = img.height;
        var ctx = c_canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
    }
    function getNativeImageData(imageData){
        if(imageData instanceof ImageData)
            return imageData;

        c_canvas.width = imageData.width;
        c_canvas.height = imageData.height;
        var ctx = c_canvas.getContext("2d");
        var result = ctx.getImageData(0, 0, imageData.width, imageData.height);
        result.data.set(imageData.data);
        return result;
    }

    function updateSinkImage(id, imageData){
        var node = c_nodes[id];
        var canvas = node._xflowip.canvas;
        var ctx = canvas.getContext("2d");
        if(!imageData){
            canvas.width = 64;
            canvas.height = 64;
            ctx.fillStyle = "black";
            ctx.fillRect(0,0, 64, 64);
        }
        else{
            imageData = getNativeImageData(imageData);
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);
        }
        syncCanvasStyle(node, canvas);
    }

    window.addEventListener('DOMContentLoaded', onDomLoaded, false);

    // Utils:
    XflowIP.error = function(msg){
        if(window.console){
            window.console.error(msg);
        }
    }

    XflowIP.warning = function(msg){
        if(window.console){
            window.console.warning(msg);
        }
    }

    XflowIP.log = function(msg){
        if(window.console){
            window.console.log(msg);
        }
    }

})();