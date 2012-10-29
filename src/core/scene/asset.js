/**
 * @class .
 * @extends SceneJS.Node
 * 
 */
SceneJS.Include = SceneJS_NodeFactory.createNodeType("asset");

SceneJS.Include.prototype._init = function(params) {

    if (this._core.useCount == 1) { // This node defines the core

        this._assetConfigs = params.asset;
        this._asset = null;

        var self = this;

        if (params.asset) {

            /*---------------------------------------------------------------------------------------------------
             * Build node core (possibly asynchronously) using a factory object
             *--------------------------------------------------------------------------------------------------*/

            if (!params.asset.type) {
                throw SceneJS_error.fatalError(
                        SceneJS.errors.ILLEGAL_NODE_CONFIG,
                        "include: asset config expected: asset.type");
            }

            var assetService = SceneJS.Plugins.getPlugin(SceneJS.Plugins.INCLUDE_ASSET_PLUGIN, this._assetConfigs.type);

            if (!assetService) {
                throw SceneJS_error.fatalError(
                        SceneJS.errors.PLUGIN_INVALID,
                        "include: no plugin installed for asset asset type '" + this._assetConfigs.type + "'.");
            }

            if (!assetService.getAsset) {
                throw SceneJS_error.fatalError(
                        SceneJS.errors.PLUGIN_INVALID,
                        "include: 'getAsset' method missing on plugin for asset asset type '" + this._assetConfigs.type + "'.");
            }

            this._asset = assetService.getAsset();

            if (!this._asset.onUpdate) {
                throw SceneJS_error.fatalError(
                        SceneJS.errors.PLUGIN_INVALID,
                        "include: 'onUpdate' method missing on plugin for asset asset type '" + params.asset.type + "'");
            }

            this._asset.onCreate(// Get notification when asset creates the asset
                    function(data) { // Data contains both typed arrays and primitive name

                        if (options) { // HACK - should apply this on GPU
                            data.positions = data.positions
                                    ? new Float32Array((options.scale || options.origin)
                                    ? self._applyOptions(data.positions, options)
                                    : data.positions) : undefined;
                        }

                        self._initNodeCore(data);

                        SceneJS.Include._buildNodeCore(self._engine.canvas.gl, self._core);

                        self._core._loading = false;
                        self._fireEvent("loaded");

                        self._engine.display.imageDirty = true;

                        self._engine.branchDirty(self); // TODO
                    });

            if (this._asset.onUpdate) {
                this._asset.onUpdate(// Reload core arrays from factory updates to the asset
                        function(data) {

                            var core = self._core;

                            if (data.positions && core.vertexBuf) {

                                //                                    if (data.positions.length > core.vertexBuf.length) {
                                //                                        alert("too long");
                                //                                    }

                                core.vertexBuf.bind();
                                core.vertexBuf.setData(data.positions, data.positionsOffset || 0);

                                if (data.positions.length > core.arrays.positions.length) {
                                    core.arrays.positions = data.positions;

                                } else {
                                    core.arrays.positions.set(data.positions, data.positionsOffset || 0);
                                }
                            }

                            if (data.normals && core.normalBuf) {

                                core.normalBuf.bind();
                                core.normalBuf.setData(data.normals, data.normalsOffset || 0);

                                if (data.normals.length > core.arrays.normals.length) {
                                    core.arrays.normals = data.normals;

                                } else {
                                    core.arrays.normals.set(data.normals, data.normalsOffset || 0);
                                }
                            }

                            if (data.uv && core.uvBuf) {

                                core.uvBuf.bind();
                                core.uvBuf.setData(data.uv, data.uvOffset || 0);

                                if (data.uv.length > core.arrays.uv.length) {
                                    core.arrays.uv = data.uv;

                                } else {
                                    core.arrays.uv.set(data.uv, data.uvOffset || 0);
                                }
                            }

                            if (data.uv2 && core.uvBuf2) {

                                core.uvBuf2.bind();
                                core.uvBuf2.setData(data.uv2, data.uv2Offset || 0);

                                if (data.uv2.length > core.arrays.uv2.length) {
                                    core.arrays.uv2 = data.uv2;

                                } else {
                                    core.arrays.uv2.set(data.uv2, data.uv2Offset || 0);
                                }
                            }

                            if (data.colors && core.colorBuf) {

                                if (data.colors.length > core.arrays.colors.length) {
                                    core.arrays.colors = data.colors;

                                } else {
                                    core.arrays.colors.set(data.colors, data.colorsOffset || 0);
                                }

                                core.colorBuf.bind();
                                core.colorBuf.setData(data.colors, data.colorsOffset || 0);
                            }

                            if (data.indices && core.indexBuf) {

                                if (data.indices.length > core.arrays.indices.length) {
                                    core.arrays.indices = data.indices;

                                } else {
                                    core.arrays.indices.set(data.indices, data.indicesOffset || 0);
                                }

                                core.indexBuf.bind();
                                core.indexBuf.setData(data.indices, data.indicesOffset || 0);

                                for (var i = 0; i < data.indices.length; i++) {
                                    var idx = data.indices[i];
                                    if (idx < 0 || idx >= core.arrays.positions.length) {
                                        alert("out of range ");
                                    }
                                    if (core.arrays.normals && (idx < 0 || idx >= core.arrays.normals.length)) {
                                        alert("out of range ");
                                    }
                                    if (core.arrays.uv && (idx < 0 || idx >= core.arrays.uv.length)) {
                                        alert("out of range ");
                                    }
                                    if (core.arrays.uv2 && (idx < 0 || idx >= core.arrays.uv2.length)) {
                                        alert("out of range ");
                                    }
                                    if (core.arrays.colors && (idx < 0 || idx >= core.arrays.colors.length)) {
                                        alert("out of range ");
                                    }
                                }
                            }


                            self._engine.display.imageDirty = true;
                        });
            }

            this._core._loading = true;

            this._fireEvent("loading");

            this._asset.setConfigs(this._assetConfigs);

        } else if (params.create instanceof Function) {

            /*---------------------------------------------------------------------------------------------------
             * Build node core from JSON arrays and primitive name returned by factory function
             *--------------------------------------------------------------------------------------------------*/

            var json = params.create();

            this._initNodeCore(json, options);

            SceneJS.Include._buildNodeCore(this._engine.canvas.gl, this._core);

        } else {

            /*---------------------------------------------------------------------------------------------------
             * Build node core from JSON arrays and primitive name given in node properties
             *--------------------------------------------------------------------------------------------------*/

            this._initNodeCore(params, options);

            SceneJS.Include._buildNodeCore(this._engine.canvas.gl, this._core);
        }

        this._core.webglRestored = function() {
            SceneJS.Include._buildNodeCore(self._engine.canvas.gl, self._core);
        };

    }
};

/**
 * Convert JSON arrays into typed arrays,
 * apply optional baked Model-space transforms to positions
 */
SceneJS.Include.prototype._initNodeCore = function(data, options) {

    options = options || {};

    this._core.primitive = this._getPrimitiveType(data.primitive || "triangles");

    this._core.arrays = {
        positions: data.positions
                ? new Float32Array((options.scale || options.origin)
                ? this._applyOptions(data.positions, options)
                : data.positions) : undefined,

        normals: data.normals ? new Float32Array(data.normals) : undefined,
        uv: data.uv ? new Float32Array(data.uv) : undefined,
        uv2: data.uv2 ? new Float32Array(data.uv2) : undefined,
        colors: data.colors ? new Float32Array(data.colors) : undefined,
        indices: data.indices ? new Uint16Array(data.indices) : undefined
    };
};

/**
 * Returns WebGL constant for primitive name
 */
SceneJS.Include.prototype._getPrimitiveType = function(primitive) {

    var gl = this._engine.canvas.gl;

    switch (primitive) {

        case "points":
            return gl.POINTS;

        case "lines":
            return gl.LINES;

        case "line-loop":
            return gl.LINE_LOOP;

        case "line-strip":
            return gl.LINE_STRIP;

        case "triangles":
            return gl.TRIANGLES;

        case "triangle-strip":
            return gl.TRIANGLE_STRIP;

        case "triangle-fan":
            return gl.TRIANGLE_FAN;

        default:
            throw SceneJS_error.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "asset primitive unsupported: '" +
                    primitive +
                    "' - supported types are: 'points', 'lines', 'line-loop', " +
                    "'line-strip', 'triangles', 'triangle-strip' and 'triangle-fan'");
    }
};

/**
 * Apply baked Model-space transformations to give position array
 */
SceneJS.Include.prototype._applyOptions = function(positions, options) {

    var positions2 = positions.slice ? positions.slice(0) : new Float32Array(positions);  // HACK

    if (options.scale) {

        var scaleX = options.scale.x != undefined ? options.scale.x : 1.0;
        var scaleY = options.scale.y != undefined ? options.scale.y : 1.0;
        var scaleZ = options.scale.z != undefined ? options.scale.z : 1.0;

        for (var i = 0, len = positions2.length; i < len; i += 3) {
            positions2[i    ] *= scaleX;
            positions2[i + 1] *= scaleY;
            positions2[i + 2] *= scaleZ;
        }
    }

    if (options.origin) {

        var originX = options.origin.x != undefined ? options.origin.x : 0.0;
        var originY = options.origin.y != undefined ? options.origin.y : 0.0;
        var originZ = options.origin.z != undefined ? options.origin.z : 0.0;

        for (var i = 0, len = positions2.length; i < len; i += 3) {
            positions2[i    ] -= originX;
            positions2[i + 1] -= originY;
            positions2[i + 2] -= originZ;
        }
    }

    return positions2;
};

/**
 * Allocates WebGL buffers for asset arrays
 *
 * In addition to initially allocating those, this is called to reallocate them after
 * WebGL context is regained after being lost.
 */
SceneJS.Include._buildNodeCore = function(gl, core) {

    var usage = gl.STATIC_DRAW; //var usage = (!arrays.fixed) ? gl.STREAM_DRAW : gl.STATIC_DRAW;

    try { // TODO: Modify usage flags in accordance with how often asset is evicted

        var arrays = core.arrays;

        if (arrays.positions) {
            core.vertexBuf = new SceneJS_webgl_ArrayBuffer(gl, gl.ARRAY_BUFFER, arrays.positions, arrays.positions.length, 3, usage);
        }

        if (arrays.normals) {
            core.normalBuf = new SceneJS_webgl_ArrayBuffer(gl, gl.ARRAY_BUFFER, arrays.normals, arrays.normals.length, 3, usage);
        }

        if (arrays.uv) {
            core.uvBuf = new SceneJS_webgl_ArrayBuffer(gl, gl.ARRAY_BUFFER, arrays.uv, arrays.uv.length, 2, usage);
        }

        if (arrays.uv2) {
            core.uvBuf2 = new SceneJS_webgl_ArrayBuffer(gl, gl.ARRAY_BUFFER, arrays.uv2, arrays.uv2.length, 2, usage);
        }

        if (arrays.colors) {
            core.colorBuf = new SceneJS_webgl_ArrayBuffer(gl, gl.ARRAY_BUFFER, arrays.colors, arrays.colors.length, 4, usage);
        }

        if (arrays.indices) {
            core.indexBuf = new SceneJS_webgl_ArrayBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, arrays.indices, arrays.indices.length, 1, usage);
        }

    } catch (e) { // Allocation failure - delete whatever buffers got allocated

        if (core.vertexBuf) {
            core.vertexBuf.destroy();
            core.vertexBuf = null;
        }

        if (core.normalBuf) {
            core.normalBuf.destroy();
            core.normalBuf = null;
        }

        if (core.uvBuf) {
            core.uvBuf.destroy();
            core.uvBuf = null;
        }

        if (core.uvBuf2) {
            core.uvBuf2.destroy();
            core.uvBuf2 = null;
        }

        if (core.colorBuf) {
            core.colorBuf.destroy();
            core.colorBuf = null;
        }

        if (core.indexBuf) {
            core.indexBuf.destroy();
            core.indexBuf = null;
        }

        throw SceneJS_error.fatalError(
                SceneJS.errors.ERROR,
                "Failed to allocate asset: " + e);
    }
};

SceneJS.Include.prototype._updateArray = function(array, items, offset) {

    var arrayLen = array.length;
    var itemsLen = items.length;

    if (itemsLen + offset > arrayLen) {
        itemsLen -= (itemsLen + offset) - arrayLen;
    }

    for (var i = offset, j = 0; j < itemsLen; i++,j++) {
        array[i] = items[j];
    }

};

SceneJS.Include.prototype.setAsset = function(assetConfigs) {
    this._assetConfigs = assetConfigs;
    var asset = this._asset;
    if (asset) {
        asset.setConfigs(assetConfigs);
    }
};

SceneJS.Include.prototype.getAsset = function() {
    return this._assetConfigs || {};
};

SceneJS.Include.prototype.setPositions = function(data) {
    if (data.positions && this._core.vertexBuf) {
        var core = this._core;
        core.vertexBuf.bind();
        core.vertexBuf.setData(new Float32Array(data.positions), data.positionsOffset || 0);
        core.arrays.positions.set(data.positions, data.positionsOffset || 0);
        this._engine.display.imageDirty = true;
    }
};

SceneJS.Include.prototype.getPositions = function() {
    return this._core.arrays ? this._core.arrays.positions : null;
};

SceneJS.Include.prototype.setNormals = function(data) {
    if (data.normals && this._core.normalBuf) {
        var core = this._core;
        core.normalBuf.bind();
        core.normalBuf.setData(new Float32Array(data.normals), data.normalsOffset || 0);
        core.arrays.normals.set(data.normals, data.normalsOffset || 0);
        this._engine.display.imageDirty = true;
    }
};

SceneJS.Include.prototype.getNormals = function() {
    return this._core.arrays ? this._core.arrays.normals : null;
};

SceneJS.Include.prototype.setColors = function(data) {
    if (data.colors && this._core.colorBuf) {
        var core = this._core;
        core.colorBuf.bind();
        core.colorBuf.setData(new Float32Array(data.colors), data.colorsOffset || 0);
        core.arrays.colors.set(data.colors, data.colorsOffset || 0);
        this._engine.display.imageDirty = true;
    }
};

SceneJS.Include.prototype.getColors = function() {
    return this._core.arrays ? this._core.arrays.colors : null;
};

SceneJS.Include.prototype.getIndices = function() {
    return this._core.arrays ? this._core.arrays.indices : null;
};

SceneJS.Include.prototype.setUV = function(data) {
    if (data.uv && this._core.colorBuf) {
        var core = this._core;
        core.colorBuf.bind();
        core.colorBuf.setData(new Float32Array(data.uv), data.uvOffset || 0);
        core.arrays.uv.set(data.uv, data.uvOffset || 0);
        this._engine.display.imageDirty = true;
    }
};

SceneJS.Include.prototype.getUV = function() {
    return this._core.arrays ? this._core.arrays.uv : null;
};

SceneJS.Include.prototype.setUV2 = function(data) {
    if (data.uv2 && this._core.colorBuf) {
        var core = this._core;
        core.colorBuf.bind();
        core.colorBuf.setData(new Float32Array(data.uv2), data.uv2Offset || 0);
        core.arrays.uv2.set(data.uv2, data.uv2Offset || 0);
        this._engine.display.imageDirty = true;
    }
};

SceneJS.Include.prototype.getUV2 = function() {
    return this._core.arrays ? this._core.arrays.uv2 : null;
};

SceneJS.Include.prototype.getPrimitive = function() {
    return this.primitive;
};

SceneJS.Include.prototype.getBoundary = function() {
    if (this._boundary) {
        return this._boundary;
    }

    var arrays = this._core.arrays;

    if (!arrays) {
        return null;
    }

    var positions = arrays.positions;

    if (!positions) {
        return null;
    }

    this._boundary = {
        xmin : SceneJS_math_MAX_DOUBLE,
        ymin : SceneJS_math_MAX_DOUBLE,
        zmin : SceneJS_math_MAX_DOUBLE,
        xmax : SceneJS_math_MIN_DOUBLE,
        ymax : SceneJS_math_MIN_DOUBLE,
        zmax : SceneJS_math_MIN_DOUBLE
    };

    var x, y, z;

    for (var i = 0, len = positions.length - 2; i < len; i += 3) {

        x = positions[i];
        y = positions[i + 1];
        z = positions[i + 2];

        if (x < this._boundary.xmin) {
            this._boundary.xmin = x;
        }
        if (y < this._boundary.ymin) {
            this._boundary.ymin = y;
        }
        if (z < this._boundary.zmin) {
            this._boundary.zmin = z;
        }
        if (x > this._boundary.xmax) {
            this._boundary.xmax = x;
        }
        if (y > this._boundary.ymax) {
            this._boundary.ymax = y;
        }
        if (z > this._boundary.zmax) {
            this._boundary.zmax = z;
        }
    }

    return this._boundary;
};

SceneJS.Include.prototype._compile = function() {

    if (this._core._loading) {
        this._compileNodes();
        return;
    }

    var core = this._core;

    if (!core.vertexBuf) {

        /* SceneJS.Include has no vertex buffer - it must be therefore be indexing a vertex/uv buffers defined
         * by a higher Asset, as part of a composite asset:
         *
         * It must therefore inherit the vertex buffer, along with UV coord buffers.
         *
         * We'll leave it to the render state graph traversal to ensure that the
         * vertex and UV buffers are not needlessly rebound for this asset.
         */
        core = this._inheritVBOs(core);
    }

    if (core.indexBuf) { // Can only render when we have indices

        core.hash = ([                           // Safe to build asset hash here - asset is immutable
            core.normalBuf ? "t" : "f",
            core.uvBuf ? "t" : "f",
            core.uvBuf2 ? "t" : "f",
            core.colorBuf ? "t" : "f",
            core.primitive
        ]).join("");

        core.stateId = this._core.stateId;
        core.type = "asset";

        this._engine.display.asset = coreStack[stackLen++] = core;

        SceneJS_events.fireEvent(SceneJS_events.OBJECT_COMPILING, { // Pull in state updates from scenes nodes
            display: this._engine.display
        });

        this._engine.display.buildObject(this.id); // Use node ID since we may inherit from many cores

    } else {
        coreStack[stackLen++] = this._core;
    }

    this._compileNodes();

    stackLen--;
};

SceneJS.Include.prototype._inheritVBOs = function(core) {

    var core2 = {
        primitive: core.primitive,
        boundary: core.boundary,
        normalBuf: core.normalBuf,
        uvBuf: core.uvBuf,
        uvBuf2: core.uvBuf2,
        colorBuf: core.colorBuf,
        indexBuf: core.indexBuf
    };

    for (var i = stackLen - 1; i >= 0; i--) {
        if (coreStack[i].vertexBuf) {
            core2.vertexBuf = coreStack[i].vertexBuf;
            core2.boundary = coreStack[i].boundary;
            core2.normalBuf = coreStack[i].normalBuf;
            core2.uvBuf = coreStack[i].uvBuf;           // Vertex and UVs are a package
            core2.uvBuf2 = coreStack[i].uvBuf2;
            core2.colorBuf = coreStack[i].colorBuf;
            return core2;
        }
    }

    return core2;
};

SceneJS.Include.prototype._destroy = function() {

    this._engine._display.removeObject(this.id);

    /* Destroy core if no other references
     */
    if (this._core.useCount == 1) {

        this._destroyNodeCore();

        if (this._asset) {
            this._asset.destroy();
        }
    }
};

SceneJS.Include.prototype._destroyNodeCore = function() {

    if (document.getElementById(this._engine.canvas.canvasId)) { // Context won't exist if canvas has disappeared

        var core = this._core;

        if (core.vertexBuf) {
            core.vertexBuf.destroy();
        }
        if (core.normalBuf) {
            core.normalBuf.destroy();
        }
        if (core.uvBuf) {
            core.uvBuf.destroy();
        }
        if (core.uvBuf2) {
            core.uvBuf2.destroy();
        }
        if (core.colorBuf) {
            core.colorBuf.destroy();
        }
        if (core.indexBuf) {
            core.indexBuf.destroy();
        }
    }
};

