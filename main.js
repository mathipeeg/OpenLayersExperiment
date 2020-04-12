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
    const baseLayerElements = document.querySelectorAll('.check-container > input[type=radio]');
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

    let circleStyle = new ol.style.Circle({
        fill: new ol.style.Fill({
            color: [61, 93, 182, 1]
        }),
        radius: 7,
        stroke: strokeStyle
    })

    let vectorSource = new ol.source.Vector({
        url: 'data/vector_data/CountriesAndCapitals.geojson',
        format: new ol.format.GeoJSON()
    });

    let polygonSource = new ol.source.Vector({
        url: 'data/vector_data/PolygonMAp.geojson',
        format: new ol.format.GeoJSON()
    });

    let pointSource = new ol.source.Vector({
        url: 'data/vector_data/AttractionPoints.geojson',
        format: new ol.format.GeoJSON()
    });

    let vectorStyle = new ol.style.Style({
        fill: fillStyle,
        stroke: strokeStyle,
        image: circleStyle
    });

    let CountriesAndCapitals = new ol.layer.VectorImage({
        source: vectorSource,
        visible: true,
        title: 'CountriesAndCapitals',
        style: vectorStyle
    })

    let AttractionPoints = new ol.layer.VectorImage({
        source: pointSource,
        visible: true,
        title: 'AttractionPoints',
        style: vectorStyle
    })

    let PolygonMap = new ol.layer.VectorImage({
        source: polygonSource,
        visible: true,
        title: 'PolygonMap',
        style: vectorStyle
    })
    /*function redraw() {
        map.removeLayer(EUCountriesGeoJSON);
        EUCountriesGeoJSON = new ol.layer.VectorImage({
            source: vectorSource,
            visible: true,
            title: 'EUCountriesGeoJSON',
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [10, 236, 236, 1] //rgb&transparent
                }),
                stroke: strokeStyle,
                image: circleStyle
            })
        })
        map.addLayer(EUCountriesGeoJSON);
    }*/
    map.addLayer(CountriesAndCapitals);
    map.addLayer(AttractionPoints);
    map.addLayer(PolygonMap);
    let lastFeature;
    // Vector Feature Popup Logic
    const overlayContainerElement = document.querySelector('.overlay-container-countries');
    const overlayContainerAttractions = document.querySelector('.overlay-container-attractions');
    const overlayLayer = new ol.Overlay({
        element: overlayContainerElement
    })
    const overlayLayerAttractions = new ol.Overlay({
        element: overlayContainerAttractions
    })
    map.addOverlay(overlayLayer);
    map.addOverlay(overlayLayerAttractions);
    const overlayFeatureName = document.getElementById('feature-name');
    const overlayFeatureAdditionalInfo = document.getElementById('feature-additional-info');
    const overlayFeatureToDo = document.getElementById('feature-to-do');
    const overlayFeatureAttrName = document.getElementById('feature-attraction-name');
    const overlayFeatureAddress = document.getElementById('feature-address');

    map.on('click', function(e){
        overlayLayer.setPosition(undefined);
        overlayLayerAttractions.setPosition(undefined);
        document.getElementById('attraction-info-div').style.display = 'none';
        //^ fjerner boksene når der klikkes
        if (!isLayerVisible) {
            map.addLayer(PolygonMap)
            isLayerVisible = true;
        }
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
            if (lastFeature){
                if (lastFeature.get('attractionaddress').length > 0){
                    lastFeature = null;
                    return;
                }
            }
            currentFeature = feature;
            let clickedCoordinate = e.coordinate;
            let clickedFeatureName = feature.get('name');
            if(feature.get('additionalinfo') !== undefined ){
                let clickedFeatureAdditionInfo = feature.get('additionalinfo');
                let clickedFeatureTodo = feature.get('todo');
                overlayLayer.setPosition(clickedCoordinate);

                overlayFeatureName.innerHTML = clickedFeatureName;
                overlayFeatureAdditionalInfo.innerHTML = clickedFeatureAdditionInfo;
                overlayFeatureToDo.innerHTML = 'To see: ' + clickedFeatureTodo;   
                lastFeature = currentFeature;
            } else {
                let clickedFeatureAddress = feature.get('attractionaddress');
                overlayLayerAttractions.setPosition(clickedCoordinate);

                overlayFeatureAttrName.innerHTML = clickedFeatureName;
                overlayFeatureAddress.innerHTML = clickedFeatureAddress;
                lastFeature = currentFeature;
            }
            view.animate({
                center: clickedCoordinate,
            zoom: 6
            })
        },
        {
            layerFilter: function(layerCandidate){
                return layerCandidate.get('title') == 'AttractionPoints', 'CountriesAndCapitals', 'PolygonMap' 
            }
        })
    })  

    function onClick(id, callback) {
        document.getElementById(id).addEventListener('click', callback);
    }
    
    let isLayerVisible = true

    onClick('feature-address', function(e) {

        console.log(currentFeature.style);
        cu
        if (isLayerVisible){
            map.removeLayer(PolygonMap)
            isLayerVisible = false;
        } else {
            map.addLayer(PolygonMap)
            isLayerVisible = true;
        }
        const attractionName = document.getElementById('attraction-name');
        const attractionDescription = document.getElementById('attraction-description');
        attractionName.innerHTML = currentFeature.get('name');;
        attractionDescription.innerHTML = currentFeature.get('attractiondescrip');
        document.getElementById('attraction-info-div').style.display = 'block';
        view.animate({
            center: e.coordinate,
            zoom: 12
        })

        

    })

    //SEARCH
    // function sort() {
    //     var input, filter, table, tr, td, i, txtValue;
    //     input = document.getElementById("myInput");
    //     filter = input.value.toUpperCase();
    //     table = document.getElementById("question-table");
    //     tr = table.getElementsByTagName("tr");
    //     for (i = 0; i < tr.length; i++) {
    //         td = tr[i].getElementsByTagName("td")[0];
    //         if (td) {
    //             txtValue = td.textContent || td.innerText;
    //             if (txtValue.toUpperCase().indexOf(filter) > -1) {
    //                 tr[i].style.display = "";
    //                 continue;
    //             } else {
    //                 tr[i].style.display = "none";
    //             }
    //         }
    //         td1 = tr[i].getElementsByTagName("td")[1];
    //         if (td1) {
    //             txtValue = td1.textContent || td1.innerText;
    //             if (txtValue.toUpperCase().indexOf(filter) > -1) {
    //                 tr[i].style.display = "";
    //             } else {
    //                 tr[i].style.display = "none";
    //             }
    //         }
    //     }
    // }
}
