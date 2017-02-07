/*global define*/
define([
        'Cesium/Core/EasingFunction',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Matrix4',
        'Cesium/Core/HeadingPitchRange',
        'Cesium/Scene/Cesium3DTileset',
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
        'domReady!'
    ], function(
        EasingFunction,
        Cartesian3,
        Matrix4,
        HeadingPitchRange,
        Cesium3DTileset,
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
        viewerDragDropMixin) {
    'use strict';

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

    viewer.extend(viewerCesiumInspectorMixin);

    var scene = viewer.scene;
    scene.globe.show = false;
    window.scene = scene;
    var camera = viewer.camera;
    var context = scene.context;

    var tests = {
        rio: {
            url: 'https://beta.cesium.com/api/assets/266?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiODNmMjQzNy1mNGI4LTQ2ZTItOWI0NS0yZDUzMzMyNWMxNzQiLCJpZCI6OSwiaWF0IjoxNDgxODI5ODU0fQ.4fmVtksZ1CAzjPBprJ47uIuK0vr-8CcuDKM7M8a0mF4',
            views: [
                // city
                queryToObject('view=-43.17432017295311%2C-22.901767831550135%2C123.1886826953149%2C231.00865711432857%2C-4.866764478249746%2C0.10820084546364604').view,
                // mountains
                queryToObject('view=-43.2764670108587%2C-22.931000967977575%2C577.2613718517274%2C148.46587195682494%2C-11.634366779238201%2C359.9262831951766').view
            ]    
        },
        philly: {
            url: '/tilesets/PhiladelphiaHiResRealityModel/',
            views: [
                // street
                queryToObject('view=-75.17293307588446%2C39.95454816854688%2C36.246357009688786%2C98.73547211947422%2C4.016383854116322%2C0.1876063297444268').view,
                // straight down
                queryToObject('view=-75.17113318627392%2C39.954353470062436%2C67.5516304185271%2C8.824384760923325%2C-88.13511150387458%2C0').view,
                // 3/4
                queryToObject('view=-75.17252163980203%2C39.959405496667394%2C358.1595291924022%2C138.4803768410846%2C-26.608646946234266%2C0.14020409717702298').view
            ]
        },
    }

    var view = endUserOptions.view;
    // view = queryToObject('view=-75.17316491886942%2C39.95554907641879%2C192.74209892083192%2C111.33680237985972%2C-10.477739985242765%2C0.17928981806736724').view;
    // view = queryToObject('view=-43.17432017295311%2C-22.901767831550135%2C123.1886826953149%2C231.00865711432857%2C-4.866764478249746%2C0.10820084546364604').view;
    // view = queryToObject('view=-43.2764670108587%2C-22.931000967977575%2C577.2613718517274%2C148.46587195682494%2C-11.634366779238201%2C359.9262831951766').view;
    // view = queryToObject('view=-43.28548135504397%2C-22.914891800617692%2C984.9674061069081%2C148.46808841310002%2C-11.651472323779595%2C359.92910692321533').view;
    // view = queryToObject('view=-74.01173968285764%2C40.701374752829%2C340.6077800729422%2C16.53031131078632%2C-12.181773955230803%2C0.05532413656164981').view;

    var dataset = tests.philly;
    view = dataset.views[2];

    var tileset = scene.primitives.add(new Cesium3DTileset({
        url: dataset.url
        // ,debugShowBoundingVolume: true
        // ,debugShowContentBoundingVolume: true
    }));

    tileset.readyPromise.then(function(tileset) {
        var boundingSphere = tileset.boundingSphere;

        // camera.viewBoundingSphere(boundingSphere, new HeadingPitchRange(
        //     CesiumMath.toRadians(180),
        //     CesiumMath.toRadians(-5.0),
        //     0.001
        // ));

        // camera.setView({
        //     destination: Cartesian3.fromDegrees(-75.16833279479728, 39.955036359566144, 16.493615387751476),
        //     orientation: {
        //         heading: CesiumMath.toRadians(105),
        //         pitch: CesiumMath.toRadians(-15),
        //         roll: CesiumMath.toRadians(0)
        //     }
        // });

        // var dest = Cartesian3.clone(camera.positionWC);
        // camera.moveBackward(20000);
        // camera.flyTo({
        //     destination: dest,
        //     orientation : {
        //         direction : Cartesian3.clone(camera.direction),
        //         up : Cartesian3.clone(camera.up)
        //     },
        //     easingFunction: EasingFunction.EXPONENTIAL_OUT,
        //     duration: 20
        // });
    });

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
});
