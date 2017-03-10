// data/adapter/json/factory.js
(function() {
    var global = window;
    // gltf parser
    (function(root, factory) {
        if (typeof exports === 'object') {
            // Node. Does not work with strict CommonJS, but
            // only CommonJS-like enviroments that support module.exports,
            // like Node.
            factory(module.exports);
        } else if (typeof define === 'function' && define.amd) {
            // AMD. Register as an anonymous module.
            define([], function() {
                return factory(root);
            });
        } else {
            // Browser globals
            factory(root);
        }
    }(this, function(root) {
        "use strict";

        var categoriesDepsOrder = ["buffers", "bufferViews", "images", "videos", "samplers", "textures", "shaders", "programs", "techniques", "materials", "accessors", "meshes", "cameras", "lights", "skins", "nodes", "scenes", "animations"];

        var glTFParser = Object.create(Object.prototype, {

            _rootDescription: {
                value: null,
                writable: true
            },

            rootDescription: {
                set: function(value) {
                    this._rootDescription = value;
                },
                get: function() {
                    return this._rootDescription;
                }
            },

            baseURL: {
                value: null,
                writable: true
            },

            //detect absolute path following the same protocol than window.location
            _isAbsolutePath: {
                value: function(path) {
                    var isAbsolutePathRegExp = new RegExp("^" + window.location.protocol, "i");

                    return path.match(isAbsolutePathRegExp) ? true : false;
                }
            },

            resolvePathIfNeeded: {
                value: function(path) {
                    if (this._isAbsolutePath(path)) {
                        return path;
                    }

                    return this.baseURL + path;
                }
            },

            _resolvePathsForCategories: {
                value: function(categories) {
                    categories.forEach(function(category) {
                        var descriptions = this.json[category];
                        if (descriptions) {
                            var descriptionKeys = Object.keys(descriptions);
                            descriptionKeys.forEach(function(descriptionKey) {
                                var description = descriptions[descriptionKey];
                                description.path = this.resolvePathIfNeeded(description.path);
                            }, this);
                        }
                    }, this);
                }
            },

            _json: {
                value: null,
                writable: true
            },

            json: {
                enumerable: true,
                get: function() {
                    return this._json;
                },
                set: function(value) {
                    if (this._json !== value) {
                        this._json = value;
                        this._resolvePathsForCategories(["buffers", "shaders", "images", "videos"]);
                    }
                }
            },

            _path: {
                value: null,
                writable: true
            },

            getEntryDescription: {
                value: function(entryID, entryType) {
                    var entries = null;

                    var category = entryType;
                    entries = this.rootDescription[category];
                    if (!entries) {
                        console.log("ERROR:CANNOT find expected category named:" + category);
                        return null;
                    }

                    return entries ? entries[entryID] : null;
                }
            },

            _stepToNextCategory: {
                value: function() {
                    this._state.categoryIndex = this.getNextCategoryIndex(this._state.categoryIndex + 1);
                    if (this._state.categoryIndex !== -1) {
                        this._state.categoryState.index = 0;
                        return true;
                    }

                    return false;
                }
            },

            _stepToNextDescription: {
                enumerable: false,
                value: function() {
                    var categoryState = this._state.categoryState;
                    var keys = categoryState.keys;
                    if (!keys) {
                        console.log("INCONSISTENCY ERROR");
                        return false;
                    }

                    categoryState.index++;
                    categoryState.keys = null;
                    if (categoryState.index >= keys.length) {
                        return this._stepToNextCategory();
                    }
                    return false;
                }
            },

            hasCategory: {
                value: function(category) {
                    return this.rootDescription[category] ? true : false;
                }
            },

            _handleState: {
                value: function() {

                    var methodForType = {
                        "buffers": this.handleBuffer,
                        "bufferViews": this.handleBufferView,
                        "shaders": this.handleShader,
                        "programs": this.handleProgram,
                        "techniques": this.handleTechnique,
                        "materials": this.handleMaterial,
                        "meshes": this.handleMesh,
                        "cameras": this.handleCamera,
                        "lights": this.handleLight,
                        "nodes": this.handleNode,
                        "scenes": this.handleScene,
                        "images": this.handleImage,
                        "animations": this.handleAnimation,
                        "accessors": this.handleAccessor,
                        "skins": this.handleSkin,
                        "samplers": this.handleSampler,
                        "textures": this.handleTexture,
                        "videos": this.handleVideo

                    };

                    var success = true;
                    while (this._state.categoryIndex !== -1) {
                        var category = categoriesDepsOrder[this._state.categoryIndex];
                        var categoryState = this._state.categoryState;
                        var keys = categoryState.keys;
                        if (!keys) {
                            categoryState.keys = keys = Object.keys(this.rootDescription[category]);
                            if (keys) {
                                if (keys.length == 0) {
                                    this._stepToNextDescription();
                                    continue;
                                }
                            }
                        }

                        var type = category;
                        var entryID = keys[categoryState.index];
                        var description = this.getEntryDescription(entryID, type);
                        if (!description) {
                            if (this.handleError) {
                                this.handleError("INCONSISTENCY ERROR: no description found for entry " + entryID);
                                success = false;
                                break;
                            }
                        } else {

                            if (methodForType[type]) {
                                if (methodForType[type].call(this, entryID, description, this._state.userInfo) === false) {
                                    success = false;
                                    break;
                                }
                            }

                            this._stepToNextDescription();
                        }
                    }

                    if (this.handleLoadCompleted) {
                        this.handleLoadCompleted(success);
                    }

                }
            },

            _loadJSONIfNeeded: {
                enumerable: true,
                value: function(callback) {
                    var self = this;
                    //FIXME: handle error
                    if (!this._json) {
                        var jsonPath = this._path;
                        var i = jsonPath.lastIndexOf("/");
                        this.baseURL = (i !== 0) ? jsonPath.substring(0, i + 1) : '';
                        var jsonfile = new XMLHttpRequest();
                        jsonfile.open("GET", jsonPath, true);
                        jsonfile.addEventListener('load', function(event) {
                            self.json = JSON.parse(jsonfile.responseText);
                            if (callback) {
                                callback(self.json);
                            }
                        }, false);
                        jsonfile.send(null);
                    } else {
                        if (callback) {
                            callback(this.json);
                        }
                    }
                }
            },

            /* load JSON and assign it as description to the reader */
            _buildLoader: {
                value: function(callback) {
                    var self = this;

                    function JSONReady(json) {
                        self.rootDescription = json;
                        if (callback)
                            callback(this);
                    }

                    this._loadJSONIfNeeded(JSONReady);
                }
            },

            _state: {
                value: null,
                writable: true
            },

            _getEntryType: {
                value: function(entryID) {
                    var rootKeys = categoriesDepsOrder;
                    for (var i = 0; i < rootKeys.length; i++) {
                        var rootValues = this.rootDescription[rootKeys[i]];
                        if (rootValues) {
                            return rootKeys[i];
                        }
                    }
                    return null;
                }
            },

            getNextCategoryIndex: {
                value: function(currentIndex) {
                    for (var i = currentIndex; i < categoriesDepsOrder.length; i++) {
                        if (this.hasCategory(categoriesDepsOrder[i])) {
                            return i;
                        }
                    }

                    return -1;
                }
            },

            load: {
                enumerable: true,
                value: function(userInfo, options) {
                    var self = this;
                    this._buildLoader(function loaderReady(reader) {
                        var startCategory = self.getNextCategoryIndex.call(self, 0);
                        if (startCategory !== -1) {
                            self._state = {
                                "userInfo": userInfo,
                                "options": options,
                                "categoryIndex": startCategory,
                                "categoryState": {
                                    "index": "0"
                                }
                            };
                            self._handleState();
                        }
                    });
                }
            },

            initWithPath: {
                value: function(path) {
                    this._path = path;
                    this._json = null;
                    return this;
                }
            },

            //this is meant to be global and common for all instances
            _knownURLs: {
                writable: true,
                value: {}
            },

            //to be invoked by subclass, so that ids can be ensured to not overlap
            loaderContext: {
                value: function() {
                    if (typeof this._knownURLs[this._path] === "undefined") {
                        this._knownURLs[this._path] = Object.keys(this._knownURLs).length;
                    }
                    return "__" + this._knownURLs[this._path];
                }
            },

            initWithJSON: {
                value: function(json, baseURL) {
                    this.json = json;
                    this.baseURL = baseURL;
                    if (!baseURL) {
                        console.log("WARNING: no base URL passed to Reader:initWithJSON");
                    }
                    return this;
                }
            }

        });

        if (root) {
            root.glTFParser = glTFParser;
        }

        return glTFParser;

    }));
    //gltf handler
    var glTFFormatHandler = function() {
        XML3D.base.JSONFormatHandler.call(this);
    }
    XML3D.createClass(glTFFormatHandler, XML3D.base.JSONFormatHandler);

    /**
     * @author Tony Parisi / http://www.tonyparisi.com/
     */
    var vec3 = XML3D.math.vec3,
        quat = XML3D.math.quat;
    var XML3DGLTF = function() {

    };

    XML3DGLTF.Loader = function(showStatus) {

        this.showStatus = showStatus;
        this.statusDomElement = showStatus ? XML3DGLTF.Loader.prototype.addStatusElement() : null;

        this.onLoadStart = function() {};
        this.onLoadProgress = function() {};
        this.onLoadComplete = function() {};

    };

    XML3DGLTF.glTFLoader = function(showStatus) {
        this.useBufferGeometry = true;
        this.meshesRequested = 0;
        this.meshesLoaded = 0;
        this.pendingMeshes = [];
        this.animationsRequested = 0;
        this.animationsLoaded = 0;
        this.animations = [];
        this.shadersRequested = 0;
        this.shadersLoaded = 0;
        this.shaders = {};
        XML3DGLTF.Loader.call(this, showStatus);
    }

    XML3DGLTF.glTFLoader.constructor = XML3DGLTF.glTFLoader;


    //gltf utilities
    XML3DGLTF.GLTFLoaderUtils = Object.create(Object, {

        // errors
        MISSING_DESCRIPTION: {
            value: "MISSING_DESCRIPTION"
        },
        INVALID_PATH: {
            value: "INVALID_PATH"
        },
        INVALID_TYPE: {
            value: "INVALID_TYPE"
        },
        XMLHTTPREQUEST_STATUS_ERROR: {
            value: "XMLHTTPREQUEST_STATUS_ERROR"
        },
        NOT_FOUND: {
            value: "NOT_FOUND"
        },
        // misc constants
        ARRAY_BUFFER: {
            value: "ArrayBuffer"
        },

        _streams: {
            value: {},
            writable: true
        },

        _streamsStatus: {
            value: {},
            writable: true
        },

        _resources: {
            value: {},
            writable: true
        },

        _resourcesStatus: {
            value: {},
            writable: true
        },

        // initialization
        init: {
            value: function() {
                this._streams = {};
                this._streamsStatus = {};
                this._resources = {};
                this._resourcesStatus = {};
            }
        },

        //manage entries
        _containsResource: {
            enumerable: false,
            value: function(resourceID) {
                return this._resources[resourceID] ? true : false;
            }
        },

        _storeResource: {
            enumerable: false,
            value: function(resourceID, resource) {
                if (!resourceID) {
                    console.log("ERROR: entry does not contain id, cannot store");
                    return;
                }

                if (this._containsResource[resourceID]) {
                    console.log("WARNING: resource:" + resourceID + " is already stored, overriding");
                }

                this._resources[resourceID] = resource;
            }
        },

        _getResource: {
            enumerable: false,
            value: function(resourceID) {
                return this._resources[resourceID];
            }
        },

        _loadStream: {
            value: function(path, type, delegate) {
                var self = this;

                if (!type) {
                    delegate.handleError(XML3DGLTF.GLTFLoaderUtils.INVALID_TYPE, null);
                    return;
                }

                if (!path) {
                    delegate.handleError(XML3DGLTF.GLTFLoaderUtils.INVALID_PATH);
                    return;
                }

                var xhr = new XMLHttpRequest();
                xhr.open('GET', path, true);
                xhr.responseType = (type === this.ARRAY_BUFFER) ? "arraybuffer" : "text";

                //if this is not specified, 1 "big blob" scenes fails to load.
                xhr.setRequestHeader("If-Modified-Since", "Sat, 01 Jan 1970 00:00:00 GMT");
                xhr.addEventListener('load', function(event) {
                    delegate.streamAvailable(path, xhr.response);
                }, false);
                xhr.addEventListener('error', function(event) {
                    delegate.handleError(XML3DGLTF.GLTFLoaderUtils.XMLHTTPREQUEST_STATUS_ERROR, xhr.status);
                }, false);
                xhr.send(null);
            }
        },

        send: {
            value: 0,
            writable: true
        },
        requested: {
            value: 0,
            writable: true
        },

        _handleRequest: {
            value: function(request) {
                var resourceStatus = this._resourcesStatus[request.id];
                if (resourceStatus) {
                    this._resourcesStatus[request.id] ++;
                } else {
                    this._resourcesStatus[request.id] = 1;
                }

                var streamStatus = this._streamsStatus[request.path];
                if (streamStatus && streamStatus.status === "loading") {
                    streamStatus.requests.push(request);
                    return;
                }

                this._streamsStatus[request.path] = {
                    status: "loading",
                    requests: [request]
                };

                var self = this;
                var processResourceDelegate = {};

                processResourceDelegate.streamAvailable = function(path, res_) {
                    var streamStatus = self._streamsStatus[path];
                    var requests = streamStatus.requests;
                    requests.forEach(function(req_) {
                        var subArray = res_.slice(req_.range[0], req_.range[1]);
                        var convertedResource = req_.delegate.convert(subArray, req_.ctx);
                        self._storeResource(req_.id, convertedResource);
                        req_.delegate.resourceAvailable(convertedResource, req_.ctx);
                        --self._resourcesStatus[req_.id];

                    }, this);

                    delete self._streamsStatus[path];

                };

                processResourceDelegate.handleError = function(errorCode, info) {
                    request.delegate.handleError(errorCode, info);
                }

                this._loadStream(request.path, request.type, processResourceDelegate);
            }
        },


        _elementSizeForGLType: {
            value: function(glType) {
                switch (glType) {
                    case WebGLRenderingContext.FLOAT:
                        return Float32Array.BYTES_PER_ELEMENT;
                    case WebGLRenderingContext.UNSIGNED_BYTE:
                        return Uint8Array.BYTES_PER_ELEMENT;
                    case WebGLRenderingContext.UNSIGNED_SHORT:
                        return Uint16Array.BYTES_PER_ELEMENT;
                    case WebGLRenderingContext.FLOAT_VEC2:
                        return Float32Array.BYTES_PER_ELEMENT * 2;
                    case WebGLRenderingContext.FLOAT_VEC3:
                        return Float32Array.BYTES_PER_ELEMENT * 3;
                    case WebGLRenderingContext.FLOAT_VEC4:
                        return Float32Array.BYTES_PER_ELEMENT * 4;
                    case WebGLRenderingContext.FLOAT_MAT3:
                        return Float32Array.BYTES_PER_ELEMENT * 9;
                    case WebGLRenderingContext.FLOAT_MAT4:
                        return Float32Array.BYTES_PER_ELEMENT * 16;
                    default:
                        return null;
                }
            }
        },

        _handleWrappedBufferViewResourceLoading: {
            value: function(wrappedBufferView, delegate, ctx) {
                var bufferView = wrappedBufferView.bufferView;
                var buffer = bufferView.buffer;
                var byteOffset = wrappedBufferView.byteOffset + bufferView.description.byteOffset;
                var range = [byteOffset, (this._elementSizeForGLType(wrappedBufferView.type) * wrappedBufferView.count) + byteOffset];

                this._handleRequest({
                    "id": wrappedBufferView.id,
                    "range": range,
                    "type": buffer.description.type,
                    "path": buffer.description.path,
                    "delegate": delegate,
                    "ctx": ctx
                }, null);
            }
        },

        getBuffer: {

            value: function(wrappedBufferView, delegate, ctx) {

                var savedBuffer = this._getResource(wrappedBufferView.id);
                if (savedBuffer) {
                    return savedBuffer;
                } else {
                    this._handleWrappedBufferViewResourceLoading(wrappedBufferView, delegate, ctx);
                }

                return null;
            }
        },

        getFile: {

            value: function(request, delegate, ctx) {

                request.delegate = delegate;
                request.ctx = ctx;

                this._handleRequest({
                    "id": request.id,
                    "path": request.path,
                    "range": [0],
                    "type": "text",
                    "delegate": delegate,
                    "ctx": ctx
                }, null);

                return null;
            }
        },
    });

    XML3DGLTF.glTFLoader.prototype.load = function(url, callback) {

        var theLoader = this;




        //mesh	
        var Mesh = function() {
            this.primitives = [];
            this.materialsPending = [];
            this.loadedGeometry = 0;
            this.onCompleteCallbacks = [];
        };

        Mesh.prototype.addPrimitive = function(geometry) {

            var self = this;
            geometry.onload = function() {
                self.loadedGeometry++;
                self.checkComplete();
            };

            this.primitives.push({
                geometry: geometry,
                //   material: material,
                mesh: null
            });
        };

        Mesh.prototype.onComplete = function(callback) {
            this.onCompleteCallbacks.push(callback);
            this.checkComplete();
        };

        Mesh.prototype.checkComplete = function() {
            var self = this;
            if (this.onCompleteCallbacks.length && this.primitives.length == this.loadedGeometry) {
                this.onCompleteCallbacks.forEach(function(callback) {
                    callback(self);
                });
                this.onCompleteCallbacks = [];
            }
        };

        // Resource management

        var ResourceEntry = function(entryID, object, description) {
            this.entryID = entryID;
            this.object = object;
            this.description = description;
        };

        var Resources = function() {
            this._entries = {};
        };

        Resources.prototype.setEntry = function(entryID, object, description) {
            if (!entryID) {
                console.error("No EntryID provided, cannot store", description);
                return;
            }

            if (this._entries[entryID]) {
                console.warn("entry[" + entryID + "] is being overwritten");
            }

            this._entries[entryID] = new ResourceEntry(entryID, object, description);
        };

        Resources.prototype.getEntry = function(entryID) {
            return this._entries[entryID];
        };

        Resources.prototype.clearEntries = function() {
            this._entries = {};
        };

        LoadDelegate = function() {}

        LoadDelegate.prototype.loadCompleted = function(callback, obj) {
            callback.call(Window, obj);
        }

        // geometry
        XML3DGLTF.GeometryIdCount = 0;
        XML3DGLTF.Geometry = function() {

            this.id = XML3DGLTF.GeometryIdCount++;


            this.name = '';

            this.vertices = [];
            this.colors = []; // one-to-one vertex colors, used in ParticleSystem and Line

            this.faces = [];

            this.faceVertexUvs = [
                []
            ];

            this.morphTargets = [];
            this.morphColors = [];
            this.morphNormals = [];

            this.skinWeights = [];
            this.skinIndices = [];

            this.lineDistances = [];

            this.boundingBox = null;
            this.boundingSphere = null;

            this.hasTangents = false;

            this.dynamic = true; // the intermediate typed arrays will be deleted when set to false

            // update flags

            this.verticesNeedUpdate = false;
            this.elementsNeedUpdate = false;
            this.uvsNeedUpdate = false;
            this.normalsNeedUpdate = false;
            this.tangentsNeedUpdate = false;
            this.colorsNeedUpdate = false;
            this.lineDistancesNeedUpdate = false;

            this.buffersNeedUpdate = false;

        };

        XML3DGLTF.BufferGeometry = function() {

            this.id = XML3DGLTF.GeometryIdCount++;


            this.name = '';

            // attributes

            this.attributes = {};

            // attributes typed arrays are kept only if dynamic flag is set

            this.dynamic = true;

            // offsets for chunks when using indexed elements

            this.offsets = [];

            // boundings

            this.boundingBox = null;
            this.boundingSphere = null;

            this.hasTangents = false;

            // for compatibility

            this.morphTargets = [];

        };

        var ClassicGeometry = function() {


            this.geometry = new XML3DGLTF.BufferGeometry;

            this.totalAttributes = 0;
            this.loadedAttributes = 0;
            this.indicesLoaded = false;
            this.finished = false;

            this.onload = null;

            this.uvs = null;
            this.indexArray = null;
        };


        ClassicGeometry.prototype.constructor = ClassicGeometry;

        ClassicGeometry.prototype.buildBufferGeometry = function() {
            // Build indexed mesh
            var geometry = this.geometry;
            geometry.attributes.index = {
                itemSize: 1,
                source: this.source
            };

            var offset = {
                start: 0,
                index: 0,
                //	count: this.indexArray.length
            };

            geometry.offsets.push(offset);


        }

        ClassicGeometry.prototype.checkFinished = function() {
            if (this.source && this.loadedAttributes === this.totalAttributes) {

                this.buildBufferGeometry();

                this.finished = true;

                if (this.onload) {
                    this.onload();
                }
            }
        };

        var IndicesContext = function(indices, geometry) {
            this.indices = indices;
            this.geometry = geometry;
        };

        // Delegate for processing index buffers

        var IndicesDelegate = function() {};

        IndicesDelegate.prototype.handleError = function(errorCode, info) {
            // FIXME: report error
            console.log("ERROR(IndicesDelegate):" + errorCode + ":" + info);
        };

        IndicesDelegate.prototype.convert = function(resource, ctx) {
            return new Uint16Array(resource, 0, ctx.indices.count);
        };

        IndicesDelegate.prototype.resourceAvailable = function(glResource, ctx) {
            var geometry = ctx.geometry;
            if (!ctx.accessor.node)
                ctx.accessor.node = createXflowBuffer("int", glResource);

            geometry.source = ctx.accessor.entryID;
            geometry.checkFinished();
            return true;
        };

        var indicesDelegate = new IndicesDelegate();

        var IndicesContext = function(indices, geometry, accessor) {
            this.accessor = accessor;
            this.indices = indices;
            this.geometry = geometry;
        };

        // Delegate for processing vertex attribute buffers
        var VertexAttributeDelegate = function() {};

        VertexAttributeDelegate.prototype.handleError = function(errorCode, info) {
            // FIXME: report error
            console.log("ERROR(VertexAttributeDelegate):" + errorCode + ":" + info);
        };

        VertexAttributeDelegate.prototype.convert = function(resource, ctx) {
            return resource;
        };

        function componentsPerElementForGLType(glType) {
            switch (glType) {
                case WebGLRenderingContext.FLOAT:
                case WebGLRenderingContext.UNSIGNED_BYTE:
                case WebGLRenderingContext.UNSIGNED_SHORT:
                    return 1;
                case WebGLRenderingContext.FLOAT_VEC2:
                    return 2;
                case WebGLRenderingContext.FLOAT_VEC3:
                    return 3;
                case WebGLRenderingContext.FLOAT_VEC4:
                    return 4;
                case WebGLRenderingContext.FLOAT_MAT4:
                    return 16;
                default:
                    return null;
            }
        }



        VertexAttributeDelegate.prototype.bufferResourceAvailable = function(glResource, ctx) {
            var geom = ctx.geometry;
            var attribute = ctx.attribute;
            var semantic = ctx.semantic;
            var floatArray;
            var i, l;
            var nComponents;
            //FIXME: Float32 is assumed here, but should be checked.

            if (semantic == "POSITION") {
                // TODO: Should be easy to take strides into account here

                if (!ctx.accessor.node) {
                    floatArray = new Float32Array(glResource, 0, attribute.count * componentsPerElementForGLType(attribute.type));
                    ctx.accessor.node = createXflowBuffer('float3', floatArray);

                }
                geom.geometry.attributes.position = {
                    itemSize: 3,
                    source: ctx.accessor.entryID
                };
            } else if (semantic == "NORMAL") {
                if (!ctx.accessor.node) {
                    floatArray = new Float32Array(glResource, 0, attribute.count * componentsPerElementForGLType(attribute.type));
                    ctx.accessor.node = createXflowBuffer('float3', floatArray);
                }
                geom.geometry.attributes.normal = {
                    itemSize: 3,
                    source: ctx.accessor.entryID
                };
            } else if ((semantic == "TEXCOORD_0") || (semantic == "TEXCOORD")) {
                if (!ctx.accessor.node) {
                    nComponents = componentsPerElementForGLType(attribute.type);
                    floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);

                    // N.B.: flip Y value... should we just set texture.flipY everywhere?
                    for (i = 0; i < floatArray.length / 2; i++) {
                        floatArray[i * 2 + 1] = 1.0 - floatArray[i * 2 + 1];
                    }

                    ctx.accessor.node = createXflowBuffer('float2', floatArray);
                }
                geom.geometry.attributes.uv = {
                    itemSize: nComponents,
                    source: ctx.accessor.entryID
                };
            } else if (semantic == "WEIGHT") {
                nComponents = componentsPerElementForGLType(attribute.type);
                floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);
                geom.geometry.attributes.skinWeight = {
                    itemSize: nComponents,
                    source: ctx.accessor.entryID
                };
            } else if (semantic == "JOINT") {
                nComponents = componentsPerElementForGLType(attribute.type);
                floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);
                geom.geometry.attributes.skinIndex = {
                    itemSize: nComponents,
                    source: ctx.accessor.entryID
                };
            }


        }

        VertexAttributeDelegate.prototype.resourceAvailable = function(glResource, ctx) {

            this.bufferResourceAvailable(glResource, ctx);

            var geom = ctx.geometry;
            geom.loadedAttributes++;
            geom.checkFinished();
            return true;
        };

        var vertexAttributeDelegate = new VertexAttributeDelegate();

        var VertexAttributeContext = function(attribute, semantic, geometry, accessor) {
            this.accessor = accessor;
            this.attribute = attribute;
            this.semantic = semantic;
            this.geometry = geometry;
        };
        // Delegate for processing inverse bind matrices buffer
        var InverseBindMatricesDelegate = function() {};

        InverseBindMatricesDelegate.prototype.handleError = function(errorCode, info) {
            // FIXME: report error
            console.log("ERROR(InverseBindMatricesDelegate):" + errorCode + ":" + info);
        };

        InverseBindMatricesDelegate.prototype.convert = function(resource, ctx) {
            var parameter = ctx.parameter;

            var glResource = null;
            switch (parameter.type) {
                case WebGLRenderingContext.FLOAT_MAT4:
                    glResource = new Float32Array(resource, 0, parameter.count * componentsPerElementForGLType(parameter.type));
                    break;
                default:
                    break;
            }

            return glResource;
        };

        InverseBindMatricesDelegate.prototype.resourceAvailable = function(glResource, ctx) {
            var skin = ctx.skin;
            skin.inverseBindMatrices = glResource;
            return true;
        };

        var inverseBindMatricesDelegate = new InverseBindMatricesDelegate();
        var InverseBindMatricesContext = function(param, skin) {
            this.parameter = param;
            this.skin = skin;
        };


        var DummyLoader = Object.create(glTFParser, {

            load: {
                enumerable: true,
                value: function(userInfo, options) {
                    this.resources = new Resources();
                    this.cameras = [];
                    this.lights = [];
                    this.animations = [];
                    this.joints = {};
                    this.skeltons = {};
                    XML3DGLTF.GLTFLoaderUtils.init();
                    glTFParser.load.call(this, userInfo, options);
                }
            },


            handleBuffer: {
                value: function(entryID, description, userInfo) {
                    this.resources.setEntry(entryID, null, description);
                    description.type = "ArrayBuffer";
                    return true;
                }
            },

            handleBufferView: {
                value: function(entryID, description, userInfo) {
                    this.resources.setEntry(entryID, null, description);

                    var buffer = this.resources.getEntry(description.buffer);
                    description.type = "ArrayBufferView";

                    var bufferViewEntry = this.resources.getEntry(entryID);
                    bufferViewEntry.buffer = buffer;
                    return true;
                }
            },

            handleImage: {
                value: function(entryID, description, userInfo) {
                    this.resources.setEntry(entryID, null, description);
                    return true;
                }
            },

            handleShader: {
                value: function(entryID, description, userInfo) {
                    return true;
                }
            },
            xml3dMaterialType: {
                value: function(materialId, technique, values, params) {


                }


            },

            handleTechnique: {
                value: function(entryID, description, userInfo) {
                    this.resources.setEntry(entryID, null, description);
                    return true;
                }
            },
            handleMaterial: {
                value: function(entryID, description, userInfo) {

                    var technique = this.resources.getEntry(description.instanceTechnique.technique);
                    var materialParams = {};
                    var values = description.instanceTechnique.values;

                    var material = this.xml3dMaterialType(entryID, technique, values);

                    this.resources.setEntry(entryID, material, description);

                    return true;
                }
            },

            handleLight: {
                value: function(entryID, description, userInfo) {
                    return true;
                }
            },
            handleAccessor: {
                value: function(entryID, description, userInfo) {
                    // Save attribute entry

                    var accessorObject = {
                        bufferView: description.bufferView,
                        byteOffset: description.byteOffset,
                        byteStride: description.byteStride,
                        count: description.count,
                        type: description.type,
                        array: [],
                        node: [],
                        id: entryID
                    };

                    this.resources.setEntry(entryID, accessorObject, description);
                    return true;
                }
            },

            handleMesh: {
                value: function(entryID, description, userInfo) {
                    var mesh = new Mesh();

                    this.resources.setEntry(entryID, mesh, description);
                    var primitivesDescription = description.primitives;
                    if (!primitivesDescription) {
                        //FIXME: not implemented in delegate
                        console.log("MISSING_PRIMITIVES for mesh:" + entryID);
                        return false;
                    }

                    for (var i = 0; i < primitivesDescription.length; i++) {
                        var primitiveDescription = primitivesDescription[i];

                        //  if (primitiveDescription.primitive === WebGLRenderingContext.TRIANGLES) {

                        var geometry = new ClassicGeometry();
                        // var materialEntry = this.resources.getEntry(primitiveDescription.material);

                        mesh.addPrimitive(geometry);

                        var indices = this.resources.getEntry(primitiveDescription.indices);
                        var bufferEntry = this.resources.getEntry(indices.description.bufferView);
                        var indicesObject = {
                            bufferView: bufferEntry,
                            byteOffset: indices.description.byteOffset,
                            count: indices.description.count,
                            id: indices.entryID,
                            type: indices.description.type
                        };

                        var indicesContext = new IndicesContext(indicesObject, geometry, indices);
                        var alreadyProcessedIndices = XML3DGLTF.GLTFLoaderUtils.getBuffer(indicesObject, indicesDelegate, indicesContext);
                        /*if(alreadyProcessedIndices) {
                            indicesDelegate.resourceAvailable(alreadyProcessedIndices, indicesContext);
                        }*/

                        // Load Vertex Attributes

                        var allAttributes = Object.keys(primitiveDescription.attributes);
                        allAttributes.forEach(function(semantic) {
                            geometry.totalAttributes++;

                            var attribute;
                            var attributeID = primitiveDescription.attributes[semantic];
                            var attributeEntry = this.resources.getEntry(attributeID);
                            if (!attributeEntry) {
                                //let's just use an anonymous object for the attribute
                                attribute = description.attributes[attributeID];
                                attribute.id = attributeID;
                                this.resources.setEntry(attributeID, attribute, attribute);

                                var bufferEntry = this.resources.getEntry(attribute.bufferView);
                                attributeEntry = this.resources.getEntry(attributeID);

                            } else {
                                attribute = attributeEntry.object;
                                attribute.id = attributeID;
                                var bufferEntry = this.resources.getEntry(attribute.bufferView);
                            }

                            var attributeObject = {
                                bufferView: bufferEntry,
                                byteOffset: attribute.byteOffset,
                                byteStride: attribute.byteStride,
                                count: attribute.count,
                                max: attribute.max,
                                min: attribute.min,
                                type: attribute.type,
                                id: attributeID
                            };

                            var attribContext = new VertexAttributeContext(attributeObject, semantic, geometry, attributeEntry);

                            var alreadyProcessedAttribute = XML3DGLTF.GLTFLoaderUtils.getBuffer(attributeObject, vertexAttributeDelegate, attribContext);
                            /*if(alreadyProcessedAttribute) {
                                vertexAttributeDelegate.resourceAvailable(alreadyProcessedAttribute, attribContext);
                            }*/
                        }, this);
                    }
                    //}
                    return true;
                }
            },

            handleCamera: {
                value: function(entryID, description, userInfo) {
                    return true;
                }
            },

            handleScene: {
                value: function(entryID, description, userInfo) {
                    return true;
                }
            },

            addPendingMesh: {
                value: function(mesh) {
                    theLoader.pendingMeshes.push({
                        mesh: mesh

                    });
                }
            },
            handleSkin: {
                value: function(entryID, description, userInfo) {
                    // Save skin entry

                    var skin = {};

                    var m = description.bindShapeMatrix;
                    skin.bindShapeMatrix = m;

                    skin.jointsIds = description.joints;
                    var inverseBindMatricesDescription = description.inverseBindMatrices;
                    skin.inverseBindMatricesDescription = inverseBindMatricesDescription;
                    skin.inverseBindMatricesDescription.id = entryID + "_inverseBindMatrices";

                    var bufferEntry = this.resources.getEntry(inverseBindMatricesDescription.bufferView);

                    var paramObject = {
                        bufferView: bufferEntry,
                        byteOffset: inverseBindMatricesDescription.byteOffset,
                        count: inverseBindMatricesDescription.count,
                        type: inverseBindMatricesDescription.type,
                        id: inverseBindMatricesDescription.bufferView,
                        name: skin.inverseBindMatricesDescription.id
                    };

                    var context = new InverseBindMatricesContext(paramObject, skin);

                    var alreadyProcessedAttribute = XML3DGLTF.GLTFLoaderUtils.getBuffer(paramObject, inverseBindMatricesDelegate, context);

                    var bufferView = this.resources.getEntry(skin.inverseBindMatricesDescription.bufferView);
                    skin.inverseBindMatricesDescription.bufferView =
                        bufferView.object;
                    this.resources.setEntry(entryID, skin, description);
                    return true;
                }
            },
            handleNode: {
                value: function(entryID, description, userInfo) {


                    var threeNode = new XML3D.data.xflowGraph.createDataNode();
                    threeNode.name = description.name;



                    if (!description.matrix) {
                        var t = description.translation;
                        var r = description.rotation;
                        var scale = description.scale;

                        var matrix = [];
                        var x = r[0];
                        var y = r[1];
                        var z = r[2];
                        var w = r[3];

                        var n = w * w + x * x + y * y + z * z;
                        var s = n ? 2 / n : 0;
                        var wx = s * w * x,
                            wy = s * w * y,
                            wz = s * w * z;
                        var xx = s * x * x,
                            xy = s * x * y,
                            xz = s * x * z
                        var yy = s * y * y,
                            yz = s * y * z,
                            zz = s * z * z;

                        matrix[0] = (1 - (yy + zz)) * scale[0];
                        matrix[1] = xy + wz;
                        matrix[2] = xz - wy;
                        matrix[3] = 0.0;
                        matrix[4] = xy - wz;
                        matrix[5] = 1 - (xx + zz);
                        matrix[6] = yz + wx;
                        matrix[7] = 0.0;
                        matrix[8] = xz + wy;
                        matrix[9] = yz - wx;
                        matrix[10] = 1 - (xx + yy);
                        matrix[11] = 0.0;
                        matrix[12] = t[0];
                        matrix[13] = t[1];
                        matrix[14] = t[2];
                        matrix[15] = 1.0;
                        description.matrix = matrix;
                    }

                    threeNode.description = description;




                    this.resources.setEntry(entryID, threeNode, description);

                    // Iterate through all node meshes and attach the appropriate objects
                    //FIXME: decision needs to be made between these 2 ways, probably meshes will be discarded.
                    var meshEntry;
                    var self = this;

                    if (description.mesh) {
                        meshEntry = this.resources.getEntry(description.mesh);
                        theLoader.meshesRequested++;
                        meshEntry.object.onComplete(function(mesh) {
                            self.addPendingMesh(mesh);
                            theLoader.meshesLoaded++;
                            theLoader.checkComplete();
                        });
                    }

                    if (description.meshes) {
                        description.meshes.forEach(function(meshID) {
                            meshEntry = this.resources.getEntry(meshID);
                            theLoader.meshesRequested++;
                            meshEntry.object.onComplete(function(mesh) {
                                self.addPendingMesh(mesh);
                                theLoader.meshesLoaded++;
                                theLoader.checkComplete();
                            });
                        }, this);
                    }
                    if (description.instanceSkin) {

                        var skinEntry = this.resources.getEntry(description.instanceSkin.skin);


                        if (skinEntry) {

                            var skin = skinEntry.object;
                            description.instanceSkin.skin = skin;
                            threeNode.instanceSkin = description.instanceSkin;

                            var sources = description.instanceSkin.sources;
                            skin.meshes = [];
                            sources.forEach(function(meshID) {
                                meshEntry = this.resources.getEntry(meshID);
                                theLoader.meshesRequested++;
                                meshEntry.object.onComplete(function(mesh) {

                                    skin.meshes.push(mesh);
                                    theLoader.meshesLoaded++;
                                    theLoader.checkComplete();
                                });
                            }, this);

                        }
                    }

                    return true;
                }
            },
            handleScene: {
                value: function(entryID, description, userInfo) {

                    if (!description.nodes) {
                        console.log("ERROR: invalid file required nodes property is missing from scene");
                        return false;
                    }

                    description.nodes.forEach(function(nodeUID) {
                        this.buildNodeHirerachy(nodeUID, userInfo.rootObj);

                    }, this);

                    // if (this.delegate) {
                    //    this.delegate.loadCompleted(userInfo.callback, userInfo.rootObj);
                    // }

                    return true;
                }
            },
            buildNodeHirerachy: {
                value: function(nodeEntryId, parentThreeNode) {
                    var nodeEntry = this.resources.getEntry(nodeEntryId);
                    var threeNode = nodeEntry.object;
                    parentThreeNode.appendChild(threeNode);

                    var children = nodeEntry.description.children;
                    if (children) {
                        children.forEach(function(childID) {
                            this.buildNodeHirerachy(childID, threeNode);
                        }, this);
                    }

                    return threeNode;
                }
            },
            handleTexture: {
                value: function(entryID, description, userInfo) {
                    // Save attribute entry
                    this.resources.setEntry(entryID, null, description);
                    return true;
                }
            },
            handleSampler: {
                value: function(entryID, description, userInfo) {
                    // Save attribute entry
                    this.resources.setEntry(entryID, description, description);
                    return true;
                }
            },
            _delegate: {
                value: new LoadDelegate,
                writable: true
            },

            delegate: {
                enumerable: true,
                get: function() {
                    return this._delegate;
                },
                set: function(value) {
                    this._delegate = value;
                }
            }

        });


        // Loader

        var Context = function(callback) {
            this.rootObj = rootObj;
            this.callback = callback;
        };

        var rootObj = new XML3D.data.xflowGraph.createDataNode();
        rootObj.name = "rootObj";

        var self = this;
        var loader = Object.create(DummyLoader);
        loader.initWithPath(url);

        loader.load(new Context(rootObj,
                function(obj) {}),
            null);

        this.loader = loader;
        this.callback = callback;
        this.rootObj = rootObj;
        return rootObj;

    }

    XML3DGLTF.glTFLoader.prototype.callLoadedCallback = function() {
        var result = {
            scene: this.rootObj,
            cameras: this.loader.cameras,
            animations: this.loader.animations,
        };

        this.callback(result);
    }

    XML3DGLTF.glTFLoader.prototype.checkComplete = function() {
        if (this.meshesLoaded == this.meshesRequested && this.shadersLoaded == this.shadersRequested && this.animationsLoaded == this.animationsRequested) {

            for (var i = 0; i < this.pendingMeshes.length; i++) {
                var pending = this.pendingMeshes[i];

            }

            for (var i = 0; i < this.animationsLoaded; i++) {
                var animation = this.animations[i];
                this.loader.buildAnimation(animation);
            }

            //this.loader.createAnimations();
            //this.loader.createMeshAnimations(this.rootObj);       
            this.callLoadedCallback();
        }
    }


    glTFFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {

        return mimetype === "application/json";
    };

    glTFFormatHandler.prototype.getFormatData = function(response, url, responseType, mimetype, callback) {
        try {

            var loader = new XML3DGLTF.glTFLoader;


            loader.load(url, function(data) {
                var result = {};

                XML3D.debug.logError(loader.loader);

                result.xflowData = createMyData(loader.loader);
                result.asset = createAsset(result.xflowData, loader.loader);
                callback(true, result);

                XML3D.debug.logError(result);

            });

        } catch (e) {
            XML3D.debug.logError("Failed to process glTF JSON file: " + e);
            callback(false);
        }
    };


    glTFFormatHandler.prototype.getFragmentData = function(documentData, fragment) {
        if (!fragment) {
            return documentData.asset;
        }
        fragment = fragment.trim();

        var matches;
        if (matches = fragment.match(/^anim\[(.+)\]$/)) {
            return documentData.xflowData.animations[matches[1]];
        }
        return null;
    }

    var formatHandlerInstance = new glTFFormatHandler();
    XML3D.base.registerFormat(formatHandlerInstance);


    var TYPED_ARRAY_MAP = {
        "int": Int32Array,
        "int4": Int32Array,
        "float": Float32Array,
        "float2": Float32Array,
        "float3": Float32Array,
        "float4": Float32Array,
        "float4x4": Float32Array,
        "bool": Uint8Array,
        "byte": Int8Array,
        "ubyte": Uint8Array
    };

    /**
     * @implements IDataAdapter
     */
    var XML3DGLTFJsJSONDataAdapter = function(xflowNode) {
        this.xflowDataNode = xflowNode;
    };
    XML3DGLTFJsJSONDataAdapter.prototype.getXflowNode = function() {
        return this.xflowDataNode;
    }

    /**
     * @implements IDataAdapter
     */
    var XML3DGLTFJsJSONAssetAdapter = function(asset) {
        this.asset = asset;
    };
    XML3DGLTFJsJSONAssetAdapter.prototype.getAsset = function() {
        return this.asset;
    }

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var XML3DGLTFJsJSONFactory = function() {
        XML3D.base.AdapterFactory.call(this, XML3D.data);
    };
    XML3D.createClass(XML3DGLTFJsJSONFactory, XML3D.base.AdapterFactory);

    XML3DGLTFJsJSONFactory.prototype.aspect = XML3D.data;
    XML3DGLTFJsJSONFactory.prototype.createAdapter = function(object) {
        if (object instanceof XML3D.base.Asset) {
            return new XML3DGLTFJsJSONAssetAdapter(object);
        } else
            return new XML3DGLTFJsJSONDataAdapter(object);
    }

    formatHandlerInstance.registerFactoryClass(XML3DGLTFJsJSONFactory);


    function createXflowValue(dataType, name, key, value) {
        var buffer = createXflowBuffer(dataType, value);

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = buffer;
        inputNode.name = name;
        inputNode.key = key;
        return inputNode;
    }

    function createXflowBuffer(dataType, value) {
        var v = new(TYPED_ARRAY_MAP[dataType])(value);
        var type = XML3D.data.BUFFER_TYPE_TABLE[dataType];
        var buffer = new Xflow.BufferEntry(type, v);
        return buffer;
    }



    function createXlowInputNode(name, data) {
        var attribNode = XML3D.data.xflowGraph.createInputNode();
        attribNode.data = data;
        attribNode.name = name;
        attribNode.key = 0;
        return attribNode;
    }

    function createXflowTexture(name, absoluteUrl, textureParams) {

        console.log(absoluteUrl);
        var image = new Image();
        image.src = absoluteUrl;
        var textureEntry = new Xflow.TextureEntry(image);
        var config = textureEntry.getSamplerConfig();
        config.wrapS = textureParams.wrapS;
        config.wrapT = textureParams.wrapS;
        config.minFilter = textureParams.minFilter;
        config.magFilter = textureParams.magFilter;
        config.textureType = Xflow.TEX_TYPE.TEXTURE_2D;
        config.generateMipMap = 1;

        image.onload = function() {
            textureEntry.setImage(image);
        };

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = textureEntry;
        inputNode.name = name;
        return inputNode;
    }

    function createMyData(loader) {

        var result = {
            attribs: {},
            animations: {},
            materials: {}
        };
        var json = loader._json;
        XML3D.debug.logError(json);
        for (var meshName in json.meshes) {

            var resources = loader.resources;

            var primitives = resources.getEntry(meshName).object.primitives;

            for (var i = 0; i < primitives.length; i++) {

                //XML3D.debug.logError(primitives);
                var attrib = primitives[i].geometry.geometry.attributes;
                var materialName = loader.resources.getEntry(meshName).description.primitives[i].material;
                var gltfMaterial = loader.resources.getEntry(materialName).description;

                if (!(result.attribs[meshName])) result.attribs[meshName] = [];

                var attribXflowNode = result.attribs[meshName][i] = XML3D.data.xflowGraph.createDataNode();

                result.attribs[meshName][i].materialName = materialName;


                if (attrib["position"]) attribXflowNode.appendChild(createXlowInputNode("position", resources.getEntry(attrib["position"].source).node));
                if (attrib["normal"]) attribXflowNode.appendChild(createXlowInputNode("normal", resources.getEntry(attrib["normal"].source).node));
                if (attrib["uv"]) attribXflowNode.appendChild(createXlowInputNode("texcoord", resources.getEntry(attrib["uv"].source).node));



                // XML3D.debug.logError(result.attribs[meshName]);			
                attribXflowNode.appendChild(createXlowInputNode("index", resources.getEntry(attrib.index.source).node));

                var matXflowNode = result.materials[materialName] = XML3D.data.xflowGraph.createDataNode();

                var materialValues = gltfMaterial.instanceTechnique.values;

                // XML3D.debug.logError(materialValues);
                if (materialValues["ambient"]) matXflowNode.appendChild(createXflowValue("float", "ambientIntensity", 0, [(materialValues["ambient"][0] +
                    materialValues["ambient"][1] +
                    materialValues["ambient"][2]) / 3.0]));

                if (materialValues["emission"]) matXflowNode.appendChild(createXflowValue("float3", "emissiveColor", 0, materialValues["emission"].slice(0, 3)));

                if (materialValues["shininess"]) matXflowNode.appendChild(createXflowValue("float", "shininess", 0, [materialValues["shininess"] / 128]));

                if (materialValues["specular"]) matXflowNode.appendChild(createXflowValue("float3", "specularColor", 0, materialValues["specular"].slice(0, 3)));

                if (materialValues["transparency"]) matXflowNode.appendChild(createXflowValue("float", "transparency", 0, [materialValues["transparency"]]));

                if (materialValues["diffuse"]) {
                    if (materialValues["diffuse"] instanceof Array) {
                        var alpha = materialValues["diffuse"][3];
                        var red = materialValues["diffuse"][0];
                        var green = materialValues["diffuse"][1];
                        var blue = materialValues["diffuse"][2];
                        matXflowNode.appendChild(createXflowValue("float3", "diffuseColor", 0, [red, green, blue]));

                    } else {
                        var textureSource = loader.resources.getEntry(materialValues["diffuse"]).description.source;
                        var texturePath = loader.resources.getEntry(textureSource).description.path;



                        var samplerSource = loader.resources.getEntry(materialValues["diffuse"]).description.sampler;
                        var textureSampler = loader.resources.getEntry(samplerSource).description;

                        matXflowNode.appendChild(createXflowTexture("diffuseTexture", texturePath, textureSampler));
                        matXflowNode.appendChild(createXflowValue("float3", "diffuseColor", 0, [1, 1, 1]));
                    }
                }

                //XML3D.debug.logError(result);
                //	XML3D.debug.logError(indices);			
                //	materials.push(material);	
                //	XML3D.debug.logError(materials);


            }
        }
        XML3D.debug.logError(result);

        return result;

    }


    function createAsset(xflowData, loader) {
        var result = new XML3D.base.Asset();
        // create materials
        for (var matName in xflowData.materials) {
            var shaderEntry = new XML3D.base.SubData(XML3D.data.xflowGraph.createDataNode(), xflowData.materials[matName]);
            shaderEntry.setName("shader_" + matName);
            result.appendChild(shaderEntry);
        }

        var scene = loader._json.scenes[loader._json.scene];
        var resources = loader.resources;

        //iterate through each node and create meshes
        scene.nodes.forEach(function(node) {

            var nodeEntry = resources.getEntry(node).object;

            var transformation = {
                type: 'float4x4'
            };
            createSubDataMesh(transformation, nodeEntry, result, xflowData)
        });


        return result;
    }

    function addMesh(attribs, result, transformation) {
        for (var i = 0; i < attribs.length; i++) {
            var meshXflowNode = XML3D.data.xflowGraph.createDataNode();
            meshXflowNode.appendChild(attribs[i]);
            var meshEntry = new XML3D.base.SubData(XML3D.data.xflowGraph.createDataNode(), meshXflowNode);
            meshEntry.setTransform(transformation.value);
            meshEntry.setMeshType("triangles");
            meshEntry.setIncludes(["shader_" + attribs[i].materialName]);
            result.appendChild(meshEntry);
        }

    }

    function createSubDataMesh(oldTransformation, nodeEntry, result, xflowData)

    {
        var description = nodeEntry.description;
        var transformation = {
            type: 'float4x4',
            value: description.matrix
        };

        if (oldTransformation.value) {
            var mulResult = [];
            XML3D.math.mat4.multiply(mulResult, oldTransformation.value, transformation.value);
            transformation = {
                type: 'float4x4',
                value: mulResult
            };
        }

        if (description.mesh)
            addMesh(xflowData.attribs[description.mesh], result, transformation);

        if (description.meshes)
            description.meshes.forEach(function(meshName) {
                addMesh(xflowData.attribs[meshName], result, transformation);
            });

        if (description.instanceSkin)
            if (description.instanceSkin.skin) {
                var sources = description.instanceSkin.sources;
                sources.forEach(function(meshName) {
                    addMesh(xflowData.attribs[meshName], result, transformation);
                });
            }

        nodeEntry._children.forEach(function(node) {
            createSubDataMesh(transformation, node, result, xflowData);
        });

    }

}());