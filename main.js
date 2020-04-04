// import {fromLonLat} from 'C:/Users/Math_/AppData/Local/Microsoft/TypeScript/3.8/node_modules/@types/ol/proj';
//import * as proj from './libs/6.2.1-dist/ol.js';


window.onload = init;

function init(){

    var view = new ol.View({
        center: [1207636.1812126199, 6828169.926997306], //x, y
        zoom: 6,
        maxZoom: 15,
        minZoom: 4
    })

    let currentFeature = null;

    const map = new ol.Map({
        //Create three things, view, layers and target.
        view: view,
        target: 'js-map'
    })

    //Basemaps layers
    const openStreetMapStandard = new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: true,
        title: 'OSMStandard'
    })

    const openStreetMapHumanitarian = new ol.layer.Tile({
        source: new ol.source.OSM({
            url: 'http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
        }),
        visible: false,
        title: 'OSMHumanitarian'
    })

    const stamenTerrain = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
            attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
        }),
        visible: false,
        title: 'StamenTerrain'
    })
    
    //Layer Group
    const baseLayerGroup = new ol.layer.Group({
        layers: [
            openStreetMapStandard, openStreetMapHumanitarian, stamenTerrain
        ]
    })
    map.addLayer(baseLayerGroup);

    // Layer Switcher Logic for Basemaps
    const baseLayerElements = document.querySelectorAll('.checkContainer > input[type=radio]');
    for(let baseLayerElement of baseLayerElements){
        baseLayerElement.addEventListener('change', function(){
            let baseLayerElementValue = this.value;
            baseLayerGroup.getLayers().forEach(function(element, index, array){
                let baseLayerTitle = element.get('title');
                element.setVisible(baseLayerTitle === baseLayerElementValue);
            })
        })
    }

    // Vector Layers
    const fillStyle = new ol.style.Fill({
        color: [236, 236, 236, 0.7] //rgb&transparent
    })

    const strokeStyle = new ol.style.Stroke({
        color: [46, 45, 45, 1],
        width: 1.2
    })

    const circleStyle = new ol.style.Circle({
        fill: new ol.style.Fill({
            color: [61, 93, 182, 1]
        }),
        radius: 7,
        stroke: strokeStyle
    })

    const EUCountriesGeoJSON = new ol.layer.VectorImage({
        source: new ol.source.Vector({
            url: 'data/vector_data/EUCountries.geojson',
            format: new ol.format.GeoJSON()
        }),
        visible: true,
        title: 'EUCountriesGeoJSON',
        style: new ol.style.Style({
            fill: fillStyle,
            stroke: strokeStyle,
            image: circleStyle
        })
    })

    map.addLayer(EUCountriesGeoJSON);
    // Vector Feature Popup Logic
    const overlayContainerElement = document.querySelector('.overlay-container');
    const overlayLayer = new ol.Overlay({
        element: overlayContainerElement
    })
    map.addOverlay(overlayLayer);
    const overlayFeatureName = document.getElementById('feature-name');
    const overlayFeatureAdditionInfo = document.getElementById('feature-additional-info');
    const overlayFeatureTodo = document.getElementById('feature-to-do');

    map.on('click', function(e){
        overlayLayer.setPosition(undefined);
        document.getElementById('attraction-info-div').style.display = 'none';
        //^ fjerner boksene når der klikkes
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
            currentFeature = feature;
            let clickedCoordinate = e.coordinate;
            let clickedFeatureName = feature.get('name');
            let clickedFeatureAdditionInfo = feature.get('additionalinfo');
            let clickedFeatureTodo = feature.get('todo');
            overlayLayer.setPosition(clickedCoordinate);
            overlayFeatureName.innerHTML = clickedFeatureName;
            overlayFeatureAdditionInfo.innerHTML = clickedFeatureAdditionInfo;
            overlayFeatureTodo.innerHTML = 'To see: \n' + clickedFeatureTodo;
        },
        {
            layerFilter: function(layerCandidate){
                return layerCandidate.get('title') == 'EUCountriesGeoJSON'
            }
        })
    })  

    var brandGate = [1489390.555468, 6894121.696014];
    var karlstejnCastle = [1579435.036057, 6435809.077698];
    var charlesBridge = [1604310.511449, 6461264.996774];
    var fortress = [1452425.694036, 6072856.755602];
    var schonCastle = [1816139.014742, 6138031.913413];

    function onClick(id, callback) {
        document.getElementById(id).addEventListener('click', callback);
    }
    
    onClick('feature-to-do', function() {
        const attractionAddress = document.getElementById('attraction-address');
        const attractionDescription = document.getElementById('attraction-description');
        attractionAddress.innerHTML = currentFeature.get('attractionaddress');;
        attractionDescription.innerHTML = currentFeature.get('attractiondescrip');
        document.getElementById('attraction-info-div').style.display = 'block';

        if(currentFeature.get('name') === 'Germany'){
            view.animate({
                    center: brandGate,
                    zoom: 12
                })
        } 
        if(currentFeature.get('name') === 'Czech Republic'){
            view.animate({
                    center: karlstejnCastle,
                    zoom: 12
                })
        } 
        if(currentFeature.get('name') === 'Prague'){
            view.animate({
                    center: charlesBridge,
                    zoom: 12
                })
        } 
        if(currentFeature.get('name') === 'Austria'){
            view.animate({
                    center: fortress,
                    zoom: 12
                })
        } 
        if(currentFeature.get('name') === 'Vienna'){
            view.animate({
                    center: schonCastle,
                    zoom: 12
                })
        } 
    })
}
