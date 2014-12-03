// data/adapter/json/factory.js
(function () {

    var ThreeJsFormatHandler = function () {
        XML3D.base.JSONFormatHandler.call(this);
    }
    XML3D.createClass(ThreeJsFormatHandler, XML3D.base.JSONFormatHandler);

    var vec3 = XML3D.math.vec3,
        quat = XML3D.math.quat;

    ThreeJsFormatHandler.prototype.isFormatSupported = function (response, responseType, mimetype) {
        return mimetype === "application/json" && response.metadata && response.metadata.formatVersion == "3.1";
    };


    function getMaterialName(name, usedNames){
        name = name.replace(/[. ]/, "_");
        var result = name;
        var i = 1;
        while(usedNames.indexOf(result) != -1){
            i++
            result = name + "_" + i;
        }
        usedNames.push(result);
        return result;
    }

    ThreeJsFormatHandler.prototype.getFormatData = function (response, url, responseType, mimetype, callback) {
         try {
            var parsed = parse(response);

            var indices = {}, attribs = {};

            convertFaces(indices, attribs, parsed, response);

            var bindAttribs = {}, animations = {};

            convertAnimation(bindAttribs, animations, response);

            var materials = response.materials;

            // Fix potential material name conflicts:
            var usedMaterialNames = [];
            for(var i = 0; i < materials.length; ++i){
                materials[i].name = getMaterialName(materials[i]["DbgName"], usedMaterialNames);
            }

            var result = {};
            result.xflowData = createXflowData(materials, indices, attribs, bindAttribs, animations, url);
            result.asset = createAsset(result.xflowData);

            callback(true, result);
        } catch (e) {
            XML3D.debug.logError("Failed to process Three.js JSON json file: " + e);
            callback(false);
        }
    };

    ThreeJsFormatHandler.prototype.getFragmentData = function(documentData, fragment){
        if(!fragment){
            return documentData.asset;
        }
        fragment = fragment.trim();

        var matches;
        if(matches = fragment.match(/^anim\[(.+)\]$/)){
            return documentData.xflowData.animations[matches[1]];
        }
        return null;
    }

    var formatHandlerInstance = new ThreeJsFormatHandler();
    XML3D.base.registerFormat(formatHandlerInstance);


    var TYPED_ARRAY_MAP = {
        "int" : Int32Array,
        "int4" : Int32Array,
        "float" : Float32Array,
        "float2" : Float32Array,
        "float3" : Float32Array,
        "float4" : Float32Array,
        "float4x4" : Float32Array,
        "bool" : Uint8Array,
        "byte" : Int8Array,
        "ubyte" : Uint8Array
    };

    /**
     * @implements IDataAdapter
     */
    var ThreeJsJSONDataAdapter = function (xflowNode) {
        this.xflowDataNode = xflowNode;
    };
    ThreeJsJSONDataAdapter.prototype.getXflowNode = function () {
        return this.xflowDataNode;
    }

        /**
     * @implements IDataAdapter
     */
    var ThreeJsJSONAssetAdapter = function (asset) {
        this.asset = asset;
    };
    ThreeJsJSONAssetAdapter.prototype.getAsset = function () {
        return this.asset;
    }

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var ThreeJsJSONFactory = function () {
        XML3D.base.AdapterFactory.call(this, XML3D.data);
    };
    XML3D.createClass(ThreeJsJSONFactory, XML3D.base.AdapterFactory);

    ThreeJsJSONFactory.prototype.aspect = XML3D.data;
    ThreeJsJSONFactory.prototype.createAdapter = function (object) {
        if(object instanceof XML3D.base.Asset){
            return new ThreeJsJSONAssetAdapter(object);
        }
        else
            return new ThreeJsJSONDataAdapter(object);
    }

    formatHandlerInstance.registerFactoryClass(ThreeJsJSONFactory);


    // Helper Methods:

    function parse( json) {

        function isBitSet( value, position ) {

            return value & ( 1 << position );

        };

        var i, j,

            offset, zLength,

            type,
            isQuad,
            hasMaterial,
            hasFaceUv, hasFaceVertexUv,
            hasFaceNormal, hasFaceVertexNormal,
            hasFaceColor, hasFaceVertexColor,

            vertex, face,

            faces = json.faces,
            vertices = json.vertices,
            normals = json.normals,
            colors = json.colors,
            uvs = json.uvs;

        var nUvLayers = 0;

        // disregard empty arrays


        nUvLayers = json.uvs.length;

        var result = {
            faces: [],
            vertices: [],
            normals: [],
            colors: [],
            uvs: []
        };

        offset = 0;
        zLength = vertices.length;

        while ( offset < zLength ) {

            vertex = {};

            vertex.x = vertices[ offset ++ ];
            vertex.y = vertices[ offset ++ ];
            vertex.z = vertices[ offset ++ ];

            result.vertices.push( vertex );
        }

        offset = 0;
        zLength = normals.length;

        while ( offset < zLength ) {

            var normal = {};

            normal.x = normals[ offset ++ ];
            normal.y = normals[ offset ++ ];
            normal.z = normals[ offset ++ ];

            result.normals.push( normal );
        }

        offset = 0;
        if(colors){
            zLength = colors.length;

            while ( offset < zLength ) {

                var color = {};
                var colorValue = colors[ offset++ ];
                color.r = (colorValue % 256) / 255;
                colorValue = Math.floor(colorValue / 256);
                color.g = (colorValue % 256) / 255;
                colorValue = Math.floor(colorValue / 256);
                color.b = (colorValue % 256) / 255;

                result.colors.push( color );
            }
        }

        for ( i = 0; i < nUvLayers; i++ ) {

            offset = 0;
            zLength = uvs[i].length;
            result.uvs[i] = [];

            while ( offset < zLength ) {

                var uv = {};

                uv.u = uvs[i][offset++];
                uv.v = uvs[i][offset++];

                result.uvs[i].push(uv);
            }

        }



        offset = 0;
        zLength = faces.length;

        while ( offset < zLength ) {

            type = faces[ offset ++ ];

            isQuad          	= isBitSet( type, 0 );
            hasMaterial         = isBitSet( type, 1 );
            hasFaceUv           = isBitSet( type, 2 );
            hasFaceVertexUv     = isBitSet( type, 3 );
            hasFaceNormal       = isBitSet( type, 4 );
            hasFaceVertexNormal = isBitSet( type, 5 );
            hasFaceColor	    = isBitSet( type, 6 );
            hasFaceVertexColor  = isBitSet( type, 7 );

            var nVertices;
            if ( isQuad ) {

                face = {type: "Face4"};
                face.positions = [];
                face.positions.push( faces[ offset ++ ]);
                face.positions.push( faces[ offset ++ ]);
                face.positions.push( faces[ offset ++ ]);
                face.positions.push( faces[ offset ++ ]);

                nVertices = 4;

            } else {

                face = {type: "Face3"};
                face.positions = [];
                face.positions.push( faces[ offset ++ ]);
                face.positions.push( faces[ offset ++ ]);
                face.positions.push(faces[ offset ++ ]);

                nVertices = 3;
            }

            face.vertexNormals = [];
            face.vertexColors = [];
            face.uvs = [];
            face.vertexUvs = [];
            for ( j = 0; j < nUvLayers; j ++ ) {
                face.vertexUvs[j] = [];
            }

            if ( hasMaterial ) {

                var materialIndex = faces[ offset ++ ];
                face.material = materialIndex;

            }

            if ( hasFaceUv ) {

                for ( i = 0; i < nUvLayers; i++ ) {

                    var uvIndex = faces[ offset ++ ];

                    face.uvs[i] = uvIndex;

                }

            }

            if ( hasFaceVertexUv ) {

                for ( i = 0; i < nUvLayers; i++ ) {

                    for ( j = 0; j < nVertices; j ++ ) {

                        uvIndex = faces[ offset ++ ];

                        face.vertexUvs[i][j] = uvIndex;

                    }
                }

            }

            if ( hasFaceNormal ) {

                var normalIndex = faces[ offset ++ ];

                face.normal = normalIndex;

            }

            if ( hasFaceVertexNormal ) {

                for ( i = 0; i < nVertices; i++ ) {

                    var normalIndex = faces[ offset ++ ];
                    face.vertexNormals.push( normalIndex );

                }

            }

            if ( hasFaceColor ) {

                face.color = faces[ offset ++ ];
            }

            if ( hasFaceVertexColor ) {

                for ( i = 0; i < nVertices; i++ ) {

                    var colorIndex = faces[ offset ++ ];
                    face.vertexColors.push( colorIndex );

                }

            }

            result.faces.push( face );

        }

        return result;

    };

    function convertFaces(indices, attribs, parsed, inputJson)
    {
        var vertexCache = {};

        initFaceAttribs(attribs, parsed, inputJson);

        var bonePerVertex = 0;
        if(inputJson['skinIndices'])
            bonePerVertex = inputJson['skinIndices'].length / (parsed.vertices.length);

        var resVertexCnt = 0;
        for(var faceIdx = 0; faceIdx < parsed.faces.length; ++faceIdx){
            var face = parsed.faces[faceIdx];

            var matIdx = face.material;
            indices[matIdx] = indices[matIdx] || [];

            var vertexCnt = face.positions.length;
            var realVertexIndices = [];

            for(var vertexIdx = 0; vertexIdx < vertexCnt; ++vertexIdx){
                var key = getVertexKey(face, vertexIdx);
                if(vertexCache[key] === undefined){
                    addAttrib(attribs["position"], parsed.vertices, face.positions[vertexIdx], undefined, addFloat3);
                    addAttrib(attribs["normal"], parsed.normals, face.vertexNormals[vertexIdx], face.normal, addFloat3);
                    addAttrib(attribs["color"], parsed.colors, face.vertexColors[vertexIdx], face.color, addColor);

                    for(var i = 0; i < parsed.uvs.length; ++i){
                        var texKey = getTexcoordName(i);
                        addAttrib(attribs[texKey], parsed.uvs[i], face.vertexUvs[i][vertexIdx], face.uvs[i], addFloat2);
                    }

                    addAttribFromJson(attribs["boneIdx"], inputJson['skinIndices'], face.positions[vertexIdx], 4, bonePerVertex);

                    normalizeBoneWeights(inputJson['skinWeights'], face.positions[vertexIdx], bonePerVertex);
                    addAttribFromJson(attribs["boneWeight"], inputJson['skinWeights'], face.positions[vertexIdx], 4, bonePerVertex);

                    vertexCache[key] = resVertexCnt++;
                }
                realVertexIndices.push(vertexCache[key]);
            }
            addIndex( indices[matIdx], realVertexIndices, vertexCnt);
        }
        for(var i in attribs){
            if(!attribs[i].hasContent)
                delete attribs[i];
        }
    }

    function convertAnimation(bindAttribs, animations, inputJson)
    {
        if(inputJson['bones']){
            bindAttribs['boneParent'] = {type: 'int', value: []};
            bindAttribs['bindTranslation'] = {type: 'float3', value: []};
            bindAttribs['bindRotation'] =  {type: 'float4', value: []};
            for(var i = 0; i < inputJson['bones'].length; ++i){
                var d = inputJson['bones'][i];
                addAttribFromJson(bindAttribs['boneParent'], [d['parent']], 0, 1, 1 );
                addAttribFromJson(bindAttribs['bindTranslation'], d['pos'], 0, 3, 3 );
                addAttribFromJson(bindAttribs['bindRotation'], d['rotq'], 0, 4, 4 );
            }
        }

        if(inputJson['animation']){
            var animName = inputJson['animation']['name'];
            animations[animName] = {};

            animations[animName]['maxKey'] = { type: 'float3', value: [ inputJson['animation']["length"] ]};
            var dest = animations[animName]["attribs"] = {};

            dest['translation']= [];
            dest['rotation']= [];

            // gather keys
            var keys = [];
            var boneData = inputJson['animation']['hierarchy'];
            var boneKeyIdx = [];
            for(var i = 0; i < boneData.length; ++i){
                for(var keyIdx = 0; keyIdx < boneData[i]['keys'].length; ++keyIdx){
                    var time = boneData[i]['keys'][keyIdx]['time'];
                    if(keys.indexOf(time) == -1 )
                        keys.push(time);
                }
                boneKeyIdx[i] = 0;
            }
            keys.sort();

            for(var keyIdx = 0; keyIdx < keys.length; ++keyIdx){
                var key = keys[keyIdx];
                var transEntry = {type: 'float3', value: [], key: key};
                var rotationEntry = {type: 'float4', value: [], key: key};
                for(var boneIdx = 0; boneIdx < boneData.length; ++boneIdx){
                    var keyData = boneData[boneIdx]['keys'];
                    var rotation, translation;

                    var idx = boneKeyIdx[boneIdx];
                    while( idx < keyData.length && keyData[idx]['time'] < key){
                        idx = ++boneKeyIdx[boneIdx];
                    }

                    if(idx >= keyData.length){
                        translation = keyData[keyData.length-1]['pos'];
                        rotation = keyData[keyData.length-1]['rot'];
                    }
                    else{

                        if(idx == 0){
                            translation = getPrevEntryWithValue(keyData, 'pos', idx)['pos'];
                            rotation = getPrevEntryWithValue(keyData, 'rot', idx)['rot'];
                        }
                        else{
                            var rot1 = getPrevEntryWithValue(keyData, 'rot', idx-1);
                            var rot2 = getNextEntryWithValue(keyData, 'rot', idx);
                            var rot_i = (key - rot1['time']) / (rot2['time'] - rot1['time']);
                            if(rot_i == 0)
                                rotation = rot1['rot'];
                            else if(rot_i == 1)
                                rotation = rot2['rot'];
                            else{
                                rotation = quat.create();
                                quat.slerp(rotation, rot1['rot'], rot2['rot'], rot_i);
                            }


                            var trans1 = getPrevEntryWithValue(keyData, 'pos', idx-1);
                            var trans2 = getNextEntryWithValue(keyData, 'pos', idx);
                            var trans_i = (key - trans1['time']) / (trans2['time'] - trans1['time']);
                            if(trans_i == 0)
                                translation = trans1['pos'];
                            else if(trans_i == 1)
                                translation = trans2['pos'];
                            else{
                                translation = vec3.create();
                                vec3.lerp(translation, trans1['pos'], trans2['pos'], trans_i);
                            }
                        }
                    }
                    addAttribFromJson(transEntry, translation, 0, 3, 3 );
                    addAttribFromJson(rotationEntry, rotation, 0, 4, 4 );
                }
                dest['translation'].push(transEntry);
                dest['rotation'].push(rotationEntry);
            }
        }
    }

    function normalizeBoneWeights(weights, index, weightsPerVertex){
        var total = 0;
        for(var i=0; i < weightsPerVertex; ++i){
            total += weights[index*weightsPerVertex+i];
        }
        if(total > 0){
            for(var i=0; i < weightsPerVertex; ++i){
                weights[index*weightsPerVertex+i] /= total;
            }
        }

    }

    function getPrevEntryWithValue(keyData, propertyName, idx){
        while(!keyData[idx][propertyName]) idx--;
        return keyData[idx];
    }
    function getNextEntryWithValue(keyData, propertyName, idx){
        while(!keyData[idx][propertyName]) idx++;
        return keyData[idx];
    }


    function initFaceAttribs(attribs, parsed, inputJson){
        attribs["position"] = {type: 'float3', value: []};
        attribs["normal"] = {type: 'float3', value: []};
        attribs["color"] = {type: 'float3', value: []};
        for(var i = 0; i < parsed.uvs.length ; ++i){
            var texKey = getTexcoordName(i);
            attribs[texKey]= {type: 'float2', value: []};
        }
        attribs["boneIdx"] = {type: 'int4', value: []};
        attribs["boneWeight"] = {type: 'float4', value: []};
    }

    function addAttrib(dest, source, vertexIndex, faceIndex, addFunction){
        var idx = vertexIndex !== undefined ? vertexIndex : faceIndex;
        if(idx !== undefined){
            dest.hasContent = true;
            addFunction(dest.value, source[idx]);
        }
        else{
            addFunction(dest.value);
        }
    }

    function addAttribFromJson(dest, source, index, destCnt, srcCnt){
        if(source){
            dest.hasContent = true;
            for(var i = 0; i < destCnt; ++i){
                dest.value.push(i < srcCnt ? Math.round(source[index*srcCnt + i]*1000000) / 1000000 : 0);
            }
        }else{
            for(var i = 0; i < destCnt; ++i){
                dest.value.push(0);
            }
        }
    }

    function addIndex(targetIdx, realVertexIndices, vertexCnt){
        if(vertexCnt == 3){
            targetIdx.push(realVertexIndices[0]);
            targetIdx.push(realVertexIndices[1]);
            targetIdx.push(realVertexIndices[2]);
        }
        else if(vertexCnt == 4){
            targetIdx.push(realVertexIndices[0]);
            targetIdx.push(realVertexIndices[1]);
            targetIdx.push(realVertexIndices[2]);
            targetIdx.push(realVertexIndices[2]);
            targetIdx.push(realVertexIndices[3]);
            targetIdx.push(realVertexIndices[0]);
        }
        else{
            throw "Unsupported Vertex Count of " + vertexCnt;
        }
    }

    function getTexcoordName(i){
        return "texcoord" + (i ? "_" + (i+1) : '');
    }

    function addFloat2(dest, source){
        dest.push(source && source.u || 0);
        dest.push(source && source.v || 0);
    }

    function addFloat3(dest, source){
        dest.push(source && source.x || 0);
        dest.push(source && source.y || 0);
        dest.push(source && source.z || 0);
    }

    function addColor(dest, source){
        dest.push(source && source.r || 0);
        dest.push(source && source.g || 0);
        dest.push(source && source.b || 0);
    }


    function getVertexKey(face, vertexIdx){
        var normaIdx = face.vertexNormals[vertexIdx];
        if(normaIdx === undefined) normaIdx = face.normal;
        var colorIdx = face.vertexColors[vertexIdx];
        if(colorIdx === undefined) colorIdx = face.color;

        var result = face.positions[vertexIdx] + ";" + normaIdx + ";" + colorIdx;
        var i = face.vertexUvs.length;
        while(i--){
            if(face.vertexUvs[i].length){
                var uvIdx = face.vertexUvs[i][vertexIdx];
                if(uvIdx === undefined) uvIdx = face.uvs[i];
                result += ";" + uvIdx;
            }

        }
        return result;
    }

    function createXflowValue(dataType, name, key, value) {
        var v = new (TYPED_ARRAY_MAP[dataType])(value);
        var type = XML3D.data.BUFFER_TYPE_TABLE[dataType];
        var buffer = new Xflow.BufferEntry(type, v);

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = buffer;
        inputNode.name = name;
        inputNode.key = key;
        return inputNode;
    }

    function createXflowTexture(name, value, docUrl){
        var absoluteUrl = new XML3D.URI(value).getAbsoluteURI(docUrl).toString();
        console.log(absoluteUrl);
        var image = new Image();
        image.src = absoluteUrl;
        var textureEntry = new Xflow.TextureEntry(image);
        var config = textureEntry.getSamplerConfig();
        config.wrapS = WebGLRenderingContext.CLAMP_TO_EDGE;;
        config.wrapT = WebGLRenderingContext.CLAMP_TO_EDGE;;
        config.minFilter = WebGLRenderingContext.LINEAR;
        config.magFilter = WebGLRenderingContext.LINEAR;
        config.textureType = Xflow.TEX_TYPE.TEXTURE_2D;
        config.generateMipMap = 1;

        image.onload = function(){
            textureEntry.setImage(image);
        };

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = textureEntry;
        inputNode.name = name;
        return inputNode;
    }


    function createXflowData(materials, indices, attribs, bindAttribs, animations, url){
        var result = {
            indices: {},
            attribs: XML3D.data.xflowGraph.createDataNode(),
            animations: {},
            materials: {}
        };


        for(var mat in indices){
            var matName = materials[mat].name;
            result.indices[matName] = createXflowValue("int", "index", 0, indices[mat]);
        }

        for(var name in attribs){
            result.attribs.appendChild(createXflowValue(attribs[name].type, name, 0, attribs[name].value));
        }
        for(var name in bindAttribs){
            result.attribs.appendChild(createXflowValue(bindAttribs[name].type, name, 0, bindAttribs[name].value));
        }
        for(var aniName in animations){
            var aniAttribs = animations[aniName]["attribs"];
            var aniXflowNode = result.animations[aniName] = XML3D.data.xflowGraph.createDataNode();
            for(var fieldName in aniAttribs){
                var fieldEntry = aniAttribs[fieldName];
                var entry = {
                    "type" : aniAttribs[fieldName][0].type,
                    "seq" : [ ]
                }
                for(var i = 0; i < fieldEntry.length; ++i){
                    aniXflowNode.appendChild(createXflowValue(fieldEntry[i].type, fieldName, fieldEntry[i].key,
                        fieldEntry[i].value));
                }
            }
        }

        for(var i = 0; i < materials.length; ++i){
            var material = materials[i];
            var matName = material.name;
            var matXflowNode = result.materials[matName] = XML3D.data.xflowGraph.createDataNode();
            if(material["colorDiffuse"]){
                matXflowNode.appendChild(createXflowValue("float3", "diffuseColor", 0, material["colorDiffuse"]));
            }
            if(material["colorSpecular"]){
                matXflowNode.appendChild(createXflowValue("float3", "specularColor", 0, material["colorSpecular"]));
            }
            if(material["colorAmbient"]){
                matXflowNode.appendChild(createXflowValue("float", "ambientIntensity", 0, [material["colorAmbient"][0]]));
            }
            if(material["specularCoef"]){
                matXflowNode.appendChild(createXflowValue("float", "shininess", 0, [material["specularCoef"] / 128]))
            }
            if(material["transparency"]){
                matXflowNode.appendChild(createXflowValue("float", "transparency", 0, [1 - material["transparency"]]))
            }
            if(material["mapDiffuse"]){
                matXflowNode.appendChild(createXflowTexture("diffuseTexture", material["mapDiffuse"], url))
            }
        };
        return result;
    }

    function createAsset(xflowData){
        var result = new XML3D.base.Asset();

        var baseXflowNode = XML3D.data.xflowGraph.createDataNode();
        baseXflowNode.appendChild(xflowData.attribs);
        baseXflowNode.appendChild(createXflowValue("float", "key", 0, [0]));
        for(var animName in xflowData.animations){
            baseXflowNode.appendChild(xflowData.animations[animName]);
            break;
        }

        var baseEntry = new XML3D.base.SubData(XML3D.data.xflowGraph.createDataNode(), baseXflowNode);
        baseEntry.setName("base");
        // TODO: Append Dataflow Stuff
        result.appendChild(baseEntry);

        for(var matName in xflowData.materials){
            var shaderEntry = new XML3D.base.SubData(XML3D.data.xflowGraph.createDataNode(), xflowData.materials[matName]);
            shaderEntry.setName("shader_" + matName);
            // TODO: Append Dataflow Stuff
            result.appendChild(shaderEntry);
        }

        for(var matName in xflowData.indices){
            var meshXflowNode = XML3D.data.xflowGraph.createDataNode();
            meshXflowNode.appendChild(xflowData.indices[matName]);
            var meshEntry = new XML3D.base.SubData(XML3D.data.xflowGraph.createDataNode(), meshXflowNode);
            meshEntry.setMeshType("triangles");
            meshEntry.setName("mesh_" + matName);
            meshEntry.setIncludes(["shader_" + matName, "base"]);
            result.appendChild(meshEntry);
        }

        return result;
    }

}());
