/*global define*/
define([
    'Cesium/Core/Cartesian3',
    'Cesium/Core/Matrix4',
    'Cesium/Core/HeadingPitchRange',
    'Cesium/Scene/Cesium3DTileset',
    'Cesium/Scene/DebugCameraPrimitive',
    'Cesium/Core/Color',
    'Cesium/Core/defined',
    'Cesium/Core/formatError',
    'Cesium/Core/Math',
    'Cesium/Core/objectToQuery',
    'Cesium/Core/queryToObject',
    'Cesium/DataSources/CzmlDataSource',
    'Cesium/DataSources/GeoJsonDataSource',
    'Cesium/DataSources/KmlDataSource',
    'Cesium/Scene/createTileMapServiceImageryProvider',
    'Cesium/Widgets/Viewer/Viewer',
    'Cesium/Widgets/Viewer/viewerCesiumInspectorMixin',
    'Cesium/Widgets/Viewer/viewerDragDropMixin',
    'Cesium/Widgets/Viewer/viewerCesium3DTilesInspectorMixin',
    'domReady!'
    // 'when!'
], function(
    Cartesian3,
    Matrix4,
    HeadingPitchRange,
    Cesium3DTileset,
    DebugCameraPrimitive,
    Color,
    defined,
    formatError,
    CesiumMath,
    objectToQuery,
    queryToObject,
    CzmlDataSource,
    GeoJsonDataSource,
    KmlDataSource,
    createTileMapServiceImageryProvider,
    Viewer,
    viewerCesiumInspectorMixin,
    viewerDragDropMixin,
    viewerCesium3DTilesInspectorMixin
) {
    'use strict';

    /*
     * 'debug'  : true/false,   // Full WebGL error reporting at substantial performance cost.
     * 'lookAt' : CZML id,      // The CZML ID of the object to track at startup.
     * 'source' : 'file.czml',  // The relative URL of the CZML file to load at startup.
     * 'stats'  : true,         // Enable the FPS performance display.
     * 'theme'  : 'lighter',    // Use the dark-text-on-light-background theme.
     * 'scene3DOnly' : false    // Enable 3D only mode
     * 'view' : longitude,latitude,[height,heading,pitch,roll]
     *    // Using degrees and meters
     *    // [height,heading,pitch,roll] default is looking straight down, [300,0,-90,0]
     */
    var endUserOptions = queryToObject(window.location.search.substring(1));

    var imageryProvider;
    if (endUserOptions.tmsImageryUrl) {
        imageryProvider = createTileMapServiceImageryProvider({
            url : endUserOptions.tmsImageryUrl
        });
    }

    var loadingIndicator = document.getElementById('loadingIndicator');
    var viewer;
    try {
        viewer = new Viewer('cesiumContainer', {
            imageryProvider : imageryProvider,
            baseLayerPicker : !defined(imageryProvider),
            scene3DOnly : endUserOptions.scene3DOnly
        });
    } catch (exception) {
        loadingIndicator.style.display = 'none';
        var message = formatError(exception);
        console.error(message);
        if (!document.querySelector('.cesium-widget-errorPanel')) {
            window.alert(message);
        }
        return;
    }

    viewer.extend(viewerDragDropMixin);
    if (endUserOptions.inspector) {
        viewer.extend(viewerCesiumInspectorMixin);
    }

    var showLoadError = function(name, error) {
        var title = 'An error occurred while loading the file: ' + name;
        var message = 'An error occurred while loading the file, which may indicate that it is invalid.  A detailed error report is below:';
        viewer.cesiumWidget.showErrorPanel(title, message, error);
    };

    viewer.dropError.addEventListener(function(viewerArg, name, error) {
        showLoadError(name, error);
    });

    var scene = viewer.scene;
    var context = scene.context;
    if (endUserOptions.debug) {
        context.validateShaderProgram = true;
        context.validateFramebuffer = true;
        context.logShaderCompilation = true;
        context.throwOnWebGLError = true;
    }

    var view = endUserOptions.view;
    var source = endUserOptions.source;
    if (defined(source)) {
        var loadPromise;

        if (/\.czml$/i.test(source)) {
            loadPromise = CzmlDataSource.load(source);
        } else if (/\.geojson$/i.test(source) || /\.json$/i.test(source) || /\.topojson$/i.test(source)) {
            loadPromise = GeoJsonDataSource.load(source);
        } else if (/\.kml$/i.test(source) || /\.kmz$/i.test(source)) {
            loadPromise = KmlDataSource.load(source, {
                camera: scene.camera,
                canvas: scene.canvas
            });
        } else {
            showLoadError(source, 'Unknown format.');
        }

        if (defined(loadPromise)) {
            viewer.dataSources.add(loadPromise).then(function(dataSource) {
                var lookAt = endUserOptions.lookAt;
                if (defined(lookAt)) {
                    var entity = dataSource.entities.getById(lookAt);
                    if (defined(entity)) {
                        viewer.trackedEntity = entity;
                    } else {
                        var error = 'No entity with id "' + lookAt + '" exists in the provided data source.';
                        showLoadError(source, error);
                    }
                } else if (!defined(view)) {
                    viewer.flyTo(dataSource);
                }
            }).otherwise(function(error) {
                showLoadError(source, error);
            });
        }
    }

    if (endUserOptions.stats) {
        scene.debugShowFramesPerSecond = true;
    }

    var theme = endUserOptions.theme;
    if (defined(theme)) {
        if (endUserOptions.theme === 'lighter') {
            document.body.classList.add('cesium-lighter');
            viewer.animation.applyThemeChanges();
        } else {
            var error = 'Unknown theme: ' + theme;
            viewer.cesiumWidget.showErrorPanel(error, '');
        }
    }

    if (defined(view)) {
        var splitQuery = view.split(/[ ,]+/);
        if (splitQuery.length > 1) {
            var longitude = !isNaN(+splitQuery[0]) ? +splitQuery[0] : 0.0;
            var latitude = !isNaN(+splitQuery[1]) ? +splitQuery[1] : 0.0;
            var height = ((splitQuery.length > 2) && (!isNaN(+splitQuery[2]))) ? +splitQuery[2] : 300.0;
            var heading = ((splitQuery.length > 3) && (!isNaN(+splitQuery[3]))) ? CesiumMath.toRadians(+splitQuery[3]) : undefined;
            var pitch = ((splitQuery.length > 4) && (!isNaN(+splitQuery[4]))) ? CesiumMath.toRadians(+splitQuery[4]) : undefined;
            var roll = ((splitQuery.length > 5) && (!isNaN(+splitQuery[5]))) ? CesiumMath.toRadians(+splitQuery[5]) : undefined;

            viewer.camera.setView({
                destination: Cartesian3.fromDegrees(longitude, latitude, height),
                orientation: {
                    heading: heading,
                    pitch: pitch,
                    roll: roll
                }
            });
        }
    }

    function saveCamera() {
        var position = camera.positionCartographic;
        var hpr = '';
        if (defined(camera.heading)) {
            hpr = ',' + CesiumMath.toDegrees(camera.heading) + ',' + CesiumMath.toDegrees(camera.pitch) + ',' + CesiumMath.toDegrees(camera.roll);
        }
        endUserOptions.view = CesiumMath.toDegrees(position.longitude) + ',' + CesiumMath.toDegrees(position.latitude) + ',' + position.height + hpr;
        history.replaceState(undefined, '', '?' + objectToQuery(endUserOptions));
    }

    var updateTimer;
    if (endUserOptions.saveCamera !== 'false') {
        var camera = viewer.camera;
        camera.moveStart.addEventListener(function() {
            if (!defined(updateTimer)) {
                updateTimer = window.setInterval(saveCamera, 1000);
            }
        });
        camera.moveEnd.addEventListener(function() {
            if (defined(updateTimer)) {
                window.clearInterval(updateTimer);
                updateTimer = undefined;
            }
            saveCamera();
        });
    }

    loadingIndicator.style.display = 'none';


    var tileset = scene.primitives.add(new Cesium3DTileset({
        url : '../../../Specs/Data/Cesium3DTiles/Tilesets/PhiladelphiaHiResRealityModel/'
    }));

    // viewer.extend(viewerCesium3DTilesInspectorMixin);
    // viewer.cesium3DTilesInspector.viewModel.tileset = tileset
    // viewer.cesium3DTilesInspector._inspectorModel.loggingVisible = true;
    // viewer.cesium3DTilesInspector.viewModel.showPickStats = false;
    // viewer.cesium3DTilesInspector.viewModel.performance = true;
    // viewer.cesium3DTilesInspector.viewModel.picking = false;

    viewer.extend(viewerCesiumInspectorMixin);

    // viewer.camera.frustum.near = 10;
    // viewer.camera.frustum.far = 80;
    // viewer.camera.fov = CesiumMath.toRadians(1.0);
    // var mat = viewer.camera.frustum.projectionMatrix;
    // viewer.scene.farToNearRatio = 5;
    // viewer.scene.debugShowFrustums = true;
    // viewer.camera.fovy = CesiumMath.toRadians(5.0);

    viewer.camera.setView({
        destination: Cartesian3.fromDegrees(-75.16833279479728, 39.955036359566144, 5.54959930463062),
        orientation: {
            heading: CesiumMath.toRadians(360),
            pitch: CesiumMath.toRadians(-90),
            roll: CesiumMath.toRadians(360)
        }
    });

    viewer.camera.setView({
        destination: Cartesian3.fromDegrees(-75.16833279479728, 39.955036359566144, 16.493615387751476),
        orientation: {
            heading: CesiumMath.toRadians(105),
            pitch: CesiumMath.toRadians(-15),
            roll: CesiumMath.toRadians(0)
        }
    });

    // one culled
    // viewer.camera.setView({
    //     destination: Cartesian3.fromDegrees(-75.16826530168719, 39.95504182319223, 61.62056005740504),
    //     orientation: {
    //         heading: CesiumMath.toRadians(94.83988108675425),
    //         pitch: CesiumMath.toRadians(-56.246968323828845),
    //         roll: CesiumMath.toRadians(0.33940914988382587)
    //     }
    // });

    //http://localhost:8080/Apps/CesiumViewer/index.html?view=-75.16925239501263%2C39.95650474728639%2C381.5373866141179%2C133.43457404385882%2C-50.32769805603576%2C0.21477836522945457

    // viewer.camera.setView({
    //     destination: Cartesian3.fromDegrees(-75.16925239501263, 39.95650474728639, 381.5373866141179),
    //     orientation: {
    //         heading: CesiumMath.toRadians(133.43457404385882),
    //         pitch: CesiumMath.toRadians(-50.32769805603576),
    //         roll: CesiumMath.toRadians(0.21477836522945457)
    //     }
    // });
    viewer.camera.setView({
        destination: Cartesian3.fromDegrees(-75.17917982244882, 39.964297965234266, 28.191975975882738),
        orientation: {
            heading: CesiumMath.toRadians(150.38934061853718),
            pitch: CesiumMath.toRadians(-2.936527771144009),
            roll: CesiumMath.toRadians(0.09366645508983115)
        }
    });
});
