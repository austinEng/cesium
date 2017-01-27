/*global define*/
define([
        '../Core/defaultValue',
        '../Core/Cartesian3',
        '../Renderer/Pass'
    ], function(
        defaultValue,
        Cartesian3,
        Pass) {
    'use strict';

    /**
     * Defines a list of commands whose geometry are bound by near and far distances from the camera.
     * @alias FrustumCommands
     * @constructor
     *
     * @param {Number} [near=0.0] The lower bound or closest distance from the camera.
     * @param {Number} [far=0.0] The upper bound or farthest distance from the camera.
     *
     * @private
     */
    function FrustumCommands(near, far) {
        this.near = defaultValue(near, 0.0);
        this.far = defaultValue(far, 0.0);

        var numPasses = Pass.NUMBER_OF_PASSES;
        var commands = new Array(numPasses);
        var indices = new Array(numPasses);

        for (var i = 0; i < numPasses; ++i) {
            commands[i] = [];
            indices[i] = 0;
        }

        this.commands = commands;
        this.indices = indices;
        // this.farPoints = [new Cartesian3(), new Cartesian3(), new Cartesian3(), new Cartesian3()];
        this.farCenter = new Cartesian3();
        this.farRight = new Cartesian3();
        this.farUp = new Cartesian3();
        this.farNormal = new Cartesian3();
    }

    FrustumCommands.prototype.computeFarSlice = function(camera) {
        Cartesian3.multiplyByScalar(camera.directionWC, this.far, this.farCenter);
        Cartesian3.add(camera.positionWC, this.farCenter, this.farCenter);

        Cartesian3.multiplyByScalar(camera.directionWC, -1, this.farNormal);

        var len = this.far * Math.tan(camera.frustum.fovy * 0.5);

        Cartesian3.multiplyByScalar(camera.upWC, len, this.farUp);
        // Cartesian3.add(this.farCenter, this.farUp, this.farUp);

        Cartesian3.multiplyByScalar(camera.rightWC, len * camera.frustum.aspectRatio, this.farRight);
        // Cartesian3.add(this.farCenter, this.farRight, this.farRight);
    };

    return FrustumCommands;
});
