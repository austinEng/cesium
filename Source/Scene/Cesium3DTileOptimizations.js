/*global define*/
define([
        '../Core/Cartesian3',
        '../Core/defaultValue',
        '../Core/freezeObject',
        './TileOrientedBoundingBox'
    ], function(
        Cartesian3,
        defaultValue,
        freezeObject,
        TileOrientedBoundingBox) {
    'use strict';

    function Cesium3DTileOptimizations(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        this.childrenWithinParent = defaultValue(options.childrenWithinParent, Cesium3DTileOptimizations.FLAGS.INDETERMINATE);
    }
    
    var scratchAxis = new Cartesian3();
    Cesium3DTileOptimizations.prototype.checkChildrenWithinParent = function(tile, evaluate, force) {
        evaluate = defaultValue(evaluate, false);
        force = defaultValue(force, false);

        if ((this.childrenWithinParent === Cesium3DTileOptimizations.FLAGS.INDETERMINATE && evaluate) || force) {
            var children = tile.children;
            var length = children.length;
            var boundingVolume = tile._boundingVolume;
            if (boundingVolume instanceof TileOrientedBoundingBox) {
                var orientedBoundingBox = boundingVolume._orientedBoundingBox;
                this.childrenWithinParent = Cesium3DTileOptimizations.FLAGS.SUPPORTED;
                for (var i = 0; i < length; ++i) {
                    var child = children[i];
                    var childBoundingVolume = child._boundingVolume;
                    if (childBoundingVolume instanceof TileOrientedBoundingBox) {
                        var childOrientedBoundingBox = childBoundingVolume._orientedBoundingBox;
                        var axis = Cartesian3.subtract(childOrientedBoundingBox.center, orientedBoundingBox.center, scratchAxis);
                        var axisLength = Cartesian3.magnitude(axis);
                        Cartesian3.divideByScalar(axis, axisLength, axis);

                        var proj1 = Math.abs(orientedBoundingBox.halfAxes[0] * axis.x) + 
                                    Math.abs(orientedBoundingBox.halfAxes[1] * axis.y) + 
                                    Math.abs(orientedBoundingBox.halfAxes[2] * axis.z) +
                                    Math.abs(orientedBoundingBox.halfAxes[3] * axis.x) + 
                                    Math.abs(orientedBoundingBox.halfAxes[4] * axis.y) + 
                                    Math.abs(orientedBoundingBox.halfAxes[5] * axis.z) +
                                    Math.abs(orientedBoundingBox.halfAxes[6] * axis.x) + 
                                    Math.abs(orientedBoundingBox.halfAxes[7] * axis.y) + 
                                    Math.abs(orientedBoundingBox.halfAxes[8] * axis.z);

                        var proj2 = Math.abs(childOrientedBoundingBox.halfAxes[0] * axis.x) + 
                                    Math.abs(childOrientedBoundingBox.halfAxes[1] * axis.y) + 
                                    Math.abs(childOrientedBoundingBox.halfAxes[2] * axis.z) +
                                    Math.abs(childOrientedBoundingBox.halfAxes[3] * axis.x) + 
                                    Math.abs(childOrientedBoundingBox.halfAxes[4] * axis.y) + 
                                    Math.abs(childOrientedBoundingBox.halfAxes[5] * axis.z) +
                                    Math.abs(childOrientedBoundingBox.halfAxes[6] * axis.x) + 
                                    Math.abs(childOrientedBoundingBox.halfAxes[7] * axis.y) + 
                                    Math.abs(childOrientedBoundingBox.halfAxes[8] * axis.z);
                        
                        if (proj1 <= proj2 + axisLength) {
                            this.childrenWithinParent = Cesium3DTileOptimizations.FLAGS.UNSUPPORTED;
                            break;
                        }
                        
                    } else {
                        this.childrenWithinParent = Cesium3DTileOptimizations.FLAGS.UNSUPPORTED;
                        break;
                    }
                }                
            }
        }

        return this.childrenWithinParent === Cesium3DTileOptimizations.FLAGS.SUPPORTED ? true : false;
    }

    Cesium3DTileOptimizations.FLAGS = freezeObject({
        UNSUPPORTED: 0,
        SUPPORTED: 1,
        INDETERMINATE: -1
    });

    return Cesium3DTileOptimizations;
});
