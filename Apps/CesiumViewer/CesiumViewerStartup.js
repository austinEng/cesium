/*global require*/
require({
    baseUrl : '.',
    paths : {
        domReady : '../../ThirdParty/requirejs-2.1.20/domReady',
        // when : '../../Source/ThirdParty/when',
        Cesium : '../../Source'
    }
}, [
        'CesiumViewer'
    ], function() {

});
