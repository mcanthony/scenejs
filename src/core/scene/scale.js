/**
 * @class Scene graph node which defines a rotation modelling transform to apply to the objects in its subgraph
 * @extends SceneJS.Node
 */
SceneJS.Scale = SceneJS_NodeFactory.createNodeType("scale");

SceneJS.Scale.prototype._init = function(params) {

    if (this._core.useCount == 1) { // This node is the resource definer

        SceneJS_modelXFormStack.buildCore(this._core);

        this.setMultOrder(params.multOrder);

        this.setXYZ({
            x: params.x,
            y: params.y,
            z: params.z
        });

        var core = this._core;

        this._core.buildMatrix = function() {
            core.matrix = SceneJS_math_scalingMat4v([core.x, core.y, core.z]);
        };
    }
};

/**
 * Sets the multiplication order of this node's transform matrix with respect to the parent modeling transform
 * in the scene graph.
 *
 * @param {String} multOrder Mulplication order - "post" and "pre"
 */
SceneJS.Scale.prototype.setMultOrder = function(multOrder) {

    multOrder = multOrder || "post";

    if (multOrder != "post" && multOrder != "pre") {

        throw SceneJS_error.fatalError(
                SceneJS.errors.NODE_CONFIG_EXPECTED,
                "Illegal multOrder for scale node - '" + multOrder + "' should be 'pre' or 'post'");
    }

    this._core.multOrder = multOrder;

    this._core.setDirty();
    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype.getAngle = function() {
    return this._core.angle;
};

SceneJS.Scale.prototype.setXYZ = function(xyz) {

    xyz = xyz || {};

    this._core.x = xyz.x || 0;
    this._core.y = xyz.y || 0;
    this._core.z = xyz.z || 0;

    this._core.setDirty();

    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype.getXYZ = function() {
    return {
        x: this._core.x,
        y: this._core.y,
        z: this._core.z
    };
};

SceneJS.Scale.prototype.setX = function(x) {
    this._core.x = x;
    this._core.setDirty();
    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype.getX = function() {
    return this._core.x;
};

SceneJS.Scale.prototype.setY = function(y) {
    this._core.y = y;
    this._core.setDirty();
    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype.getY = function() {
    return this._core.y;
};

SceneJS.Scale.prototype.setZ = function(z) {
    this._core.z = z;
    this._core.setDirty();
    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype.getZ = function() {
    return this._core.z;
};

SceneJS.Scale.prototype.incX = function(x) {
    this._core.x += x;
    this._core.setDirty();
    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype.incY = function(y) {
    this._core.y += y;
    this._core.matrixDirty = true;
};

SceneJS.Scale.prototype.incZ = function(z) {
    this._core.z += z;
    this._core.setDirty();
    this._engine.display.imageDirty = true;
};

SceneJS.Scale.prototype._compile = function() {
    SceneJS_modelXFormStack.push(this._core);
    this._compileNodes();
    SceneJS_modelXFormStack.pop();
};
