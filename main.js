window.onload = init;

function init(){

    var view = new ol.View({
        center: [1207636.1812126199, 6828169.926997306], //x, y
        zoom: 6,
        maxZoom: 15,
        minZoom: 2
    })

    const map = new ol.Map({
        //Create three things, view, layers and target.
        view: view,
        target: 'js-map'
    })

    //Basemaps layers
    const openStreetMapStandard = new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: false,
        title: 'OSMStandard'
    })

    const openStreetMapHumanitarian = new ol.layer.Tile({
        source: new ol.source.OSM({
            url: 'http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
        }),
        visible: true,
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
    let fillStyle = new ol.style.Fill({
        color: [236, 236, 236, 0.6] //rgb&transparent
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

    const empireSource = new ol.source.Vector({
        url: 'data/vector_data/Empires.geojson',
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
        style: vectorStyle,
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
        style: vectorStyle,
    })

    let EmpireMap = new ol.layer.VectorImage({
        source: empireSource,
        visible: true,
        title: 'EmpireMap',
        style: setPolyStyle([202, 25, 25, 0.6], get15Stroke([0, 0, 0, 1])),
    })

    map.addLayer(PolygonMap);
    map.addLayer(AttractionPoints);
    map.addLayer(CountriesAndCapitals);
    map.addLayer(EmpireMap);
    EmpireMap.setVisible(false);

    const overlayContainerElement = document.querySelector('.overlay-container-countries');
    const overlayContainerAttractions = document.querySelector('.overlay-container-attractions');
    let overlayContainerEmpires = document.querySelector('.overlay-container-empires');
    let overlayNewPoint = document.querySelector('#new-point-info-div');

    const overlayLayer = new ol.Overlay({
        element: overlayContainerElement
    })
    const overlayLayerAttractions = new ol.Overlay({
        element: overlayContainerAttractions
    })
    const overlayLayerEmpires = new ol.Overlay({
        element: overlayContainerEmpires
    })
    const overlayLayerNewPoint = new ol.Overlay({
        element: overlayNewPoint
    })

    map.addOverlay(overlayLayer);
    map.addOverlay(overlayLayerAttractions);
    map.addOverlay(overlayLayerEmpires);
    map.addOverlay(overlayLayerNewPoint);
    const overlayFeatureName = document.getElementById('feature-name');
    const overlayFeatureAdditionalInfo = document.getElementById('feature-additional-info');
    const overlayFeatureToDo = document.getElementById('feature-to-do');
    const overlayFeatureAttrName = document.getElementById('feature-attraction-name');
    const overlayFeatureAddress = document.getElementById('feature-address');
    let empireMap = false;
    let placePin = false;
    let currentFeature = undefined;


    var listenerKey = vectorSource.on('change', function(e) {
        if (vectorSource.getState() == 'ready') {
            ol.Observable.unByKey(listenerKey);

            let countryArray = vectorSource.getFeatures();
            countryArray.forEach(country =>{
            if(country.get('name').includes('Atlantis')){
                country.setStyle(setPointStyle([0,0,0,0], get15Stroke([0, 0, 0, 1]), [0,0,0,0], 7, get15Stroke([0, 0, 0, 0])))
                }
            })
        }
    });
    
    document.getElementById('place-point-btn').addEventListener('click', function(e){
        if(placePin){
            placePin = false;
        } else {
            placePin = true;
        }
    })

    let addedFeatureSource = new ol.source.Vector({
        features: []
    });

    let PinLayer = new ol.layer.Vector({
        source: addedFeatureSource
    });
    
    let tempPinLayer;
    let esss;

    function setPins(name, info){
        let iconGeometry = new ol.geom.Point(esss.coordinate);
        let iconFeature = new ol.Feature({
            geometry: iconGeometry,
            name: name,
            info: info,
            attractionaddress: info
        });
        
        let iconStyle = setPointStyle([236, 231, 23, 0.6], get15Stroke([0, 0, 0, 1]), [230, 101, 10, 1], 7, get15Stroke([0, 0, 0, 1]))

        iconFeature.setStyle(iconStyle);

        addedFeatureSource.addFeatures([iconFeature]);
        
        placePin = false;
    }

    addedFeatureSource.on('change', function() {
        if (addedFeatureSource.getState() == 'ready') {
            map.removeLayer(PinLayer);
            map.addLayer(PinLayer);
        }
    });

    function setPin(e) {
        esss = e;
        let iconGeometry = new ol.geom.Point(e.coordinate);
        let iconFeature = new ol.Feature({
            geometry: iconGeometry
        });
        let iconStyle = setPointStyle([236, 23, 23, 0.6], get15Stroke([0, 0, 0, 1]), [230, 10, 10, 1], 7, get15Stroke([0, 0, 0, 1]))

        iconFeature.setStyle(iconStyle);

        let vectorSource = new ol.source.Vector({
            features: [iconFeature]
        });

        tempPinLayer = new ol.layer.Vector({
            source: vectorSource 
        });

        map.addLayer(tempPinLayer);
        overlayLayerNewPoint.setPosition(e.coordinate);
        
    }

    document.getElementById('new-point-submit').addEventListener('click', function(){
        let pointName = document.getElementById('new-point-name').value;
        let pointInfo = document.getElementById('new-point-info').value;
        setPins(pointName, pointInfo);

        map.removeLayer(tempPinLayer);
        overlayLayerNewPoint.setPosition(undefined);
        document.getElementById('new-point-name').value = '';
        document.getElementById('new-point-info').value = '';
    })

    map.on('singleclick', function(e){
        overlayLayer.setPosition(undefined);
        overlayLayerAttractions.setPosition(undefined);
        document.getElementById('attraction-info-div').style.display = 'none';
        //^ fjerner boksene når der klikkes
        if(placePin){
            setPin(e)
        }else {
            if (!isLayerVisible) {
                let polyArray = polygonSource.getFeatures();
                polyArray.forEach(poly =>
                    poly.setStyle(setPolyStyle([236, 236, 236, 0.6], get15Stroke([0, 0, 0, 1])))
                )
                isLayerVisible = true;
            }
            let clickedCapital = false;
            if (empireMap === false){
                map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
                    if(currentFeature){
                        if(feature.get('additionalinfo') === undefined && clickedCapital == false){
                            currentFeature = feature;
                            
                        }
                    } else{
                        currentFeature = feature;
                    }
                    let clickedCoordinate = e.coordinate;
                    if(feature.get('additionalinfo') !== undefined && feature.get('polygon') !== 'true'){
                        console.log('aa')
                        featureOverlay(feature, clickedCoordinate, true);
                        clickedCapital = true;
                    } else if (feature.get('additionalinfo') === undefined && clickedCapital == false) {
                        console.log('ww')
                        featureOverlay(feature, clickedCoordinate, false)
                        clickedCapital = true;  
                    } else if (feature.get('additionalinfo') !== undefined && clickedCapital === false && feature.get('polygon') === 'true'){
                        console.log('ff')
                        featureOverlay(feature, clickedCoordinate, true)
                    }
    
                    let coordinates = feature.getGeometry().getCoordinates();
                    if (coordinates.length === 2) {
                        view.animate({
                            center: [coordinates[0], coordinates[1]],
                        zoom: 6
                        })
                    } else {
                        view.animate({
                            center: clickedCoordinate,
                        zoom: 6
                        })
                    }
                },
                {
                    layerFilter: function(layerCandidate){
                        return layerCandidate.get('title') == 'AttractionPoints', 'CountriesAndCapitals', 'PolygonMap' 
                    }
                }) 
            }
        }
    })  

    function featureOverlay(feature, clickedCoordinate, country){
        if(country){
            overlayLayer.setPosition(clickedCoordinate);
            overlayFeatureName.innerHTML = feature.get('name');
            overlayFeatureAdditionalInfo.innerHTML = feature.get('additionalinfo');
            overlayFeatureToDo.innerHTML = 'To see: <br>' + feature.get('todo');
        } else {
            overlayLayerAttractions.setPosition(clickedCoordinate);
            overlayFeatureAttrName.innerHTML = feature.get('name');
            overlayFeatureAddress.innerHTML = feature.get('attractionaddress');
        }
        
    }
    let isLayerVisible = true

    //Når klik på adresse
    document.getElementById('feature-address').addEventListener('click', function(e) {
            // test = false;
            let polyArray = polygonSource.getFeatures();
            if (isLayerVisible){
                polyArray.forEach(poly =>
                    poly.setStyle(setPolyStyle([204, 102, 0, 0.0]), get15Stroke([0, 0, 0, 1]))
                )
                isLayerVisible = false;
            } else {
                isLayerVisible = true;
            }
            const attractionName = document.getElementById('attraction-name');
            const attractionDescription = document.getElementById('attraction-description');
            attractionName.innerHTML = currentFeature.get('name');
            attractionDescription.innerHTML = currentFeature.get('attractiondescrip');
            document.getElementById('attraction-info-div').style.display = 'block';
            let coordinates = currentFeature.getGeometry().getCoordinates();
            view.animate({
                center: [coordinates[0], coordinates[1]],
                zoom: 12
            })
    })

    //SEARCH
    window.addEventListener('keyup', function(event){
        var attractionArray, countryArray, countryAndAttractionArray, polyArray, jointArray, input, upperCaseInput, i;
        input = document.getElementById('search-input').value;
        upperCaseInput = input.toUpperCase();
        attractionArray = pointSource.getFeatures();
        countryArray = vectorSource.getFeatures();
        polyArray = polygonSource.getFeatures();
        countryAndAttractionArray = attractionArray.concat(countryArray);
        jointArray = countryAndAttractionArray.concat(polyArray);

        jointArray.forEach(feature =>{
            if (upperCaseInput.length !== 0){
                if (!feature.get('tags').toUpperCase().includes(upperCaseInput)){
                    feature.setStyle(new ol.style.Style({}));
                } else {
                    console.log('feature to change style: ' + feature.get('name'))
                    feature.setStyle(null);
                    map.removeLayer(AttractionPoints)
                    map.addLayer(AttractionPoints)
                }
                if(feature.get('name').includes('Atlantis') && feature.get('tags').toUpperCase().includes(upperCaseInput)){
                    feature.setStyle(setPointStyle([236, 236, 236, 0.6], get15Stroke([0, 0, 0, 1]), [61, 93, 182, 1], 7, get15Stroke([0, 0, 0, 1])))

                } else {
                    feature.setStyle(new ol.style.Style({}));   

                }        
            } else {
                feature.setStyle(null);
                if(feature.get('name').includes('Atlantis')){
                    feature.setStyle(new ol.style.Style({}));
                }
            }
        })
    });
    
    document.getElementById('standard-view').addEventListener('click', function(event){
        empireMap = false;
        // overlayContainerEmpires.setPosition(undefined);
        let standardView = document.getElementById('standard-view');
        standardView.checked = true;
        document.getElementById('empire-choice-div').style.display = 'none';
        document.getElementById('search-input').style.display = 'block';
        document.getElementById('place-point-div').style.display = 'block';
        PinLayer.setVisible(true);

        swapLayers('standard')
    })

    document.getElementById('empire-view').addEventListener('click', function(e){ 
        let featureName, empireArray, clickedCoordinate, featureYear, overlayName, overlayYear, radios, isChecked;
        document.getElementById('empire-choice-div').style.display = 'block';
        document.getElementById('search-input').style.display = 'none';
        document.getElementById('place-point-div').style.display = 'none';
        overlayLayer.setPosition(undefined);
        overlayLayerAttractions.setPosition(undefined);
        PinLayer.setVisible(false);

        radios = document.getElementsByName('empire-choice');
        empireMap = true;
        isChecked = false;
        swapLayers('empire')

        radios.forEach(radio =>
                radio.addEventListener('click', function(e){
                    isChecked = true;
                    empireArray = empireSource.getFeatures();
                    setEmpireStyle(empireArray);
                    empireArray.forEach(empire =>{
                        if(!empire.get('name').includes(radio.value) && radio.value !== 'Show All'){
                            empire.setStyle(new ol.style.Style({}));
                        }
                        if (radio.value === 'Show All'){
                            isChecked = false;
                        }
                    })
                })
            )

        map.on('pointermove', function(e){
            if(empireMap === true && isChecked === false){
                overlayLayerEmpires.setPosition(undefined);
                empireArray = empireSource.getFeatures();
                setEmpireStyle(empireArray);
                
                map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
                    overlayName = document.getElementById('feature-empire-name');
                    overlayYear = document.getElementById('feature-year');
                    featureName = feature.get('name');
                    clickedCoordinate = e.coordinate;
                    featureYear = feature.get('year');
                    overlayLayerEmpires.setPosition(clickedCoordinate);
                    overlayName.innerHTML = featureName;
                    overlayYear.innerHTML = featureYear;

                    empireArray.forEach(empire => {
                        if(!empire.get('name').includes(featureName)){
                            empire.setStyle(new ol.style.Style({}));
                        }
                    })

                    radios.forEach(radio => {
                        if(featureName.includes(radio.value)){
                            radio.checked = true;
                        }
                    })
                })
            }
        })
    })

    function swapLayers(layer){
        if(layer == 'standard'){
            EmpireMap.setVisible(false);
            AttractionPoints.setVisible(true);
            CountriesAndCapitals.setVisible(true);
            PolygonMap.setVisible(true);
        } else {
            EmpireMap.setVisible(true);
            AttractionPoints.setVisible(false);
            CountriesAndCapitals.setVisible(false);
            PolygonMap.setVisible(false);
        }
        
    }

    function setEmpireStyle(empireArray){
        empireArray.forEach(empire =>{
            let empireName = empire.get('name');
            empire.setStyle(null);
            if(empireName.includes('Russian')){
                empire.setStyle(setPolyStyle([48, 100, 242, 0.6], get15Stroke([0, 0, 0, 1])))
            }
            if(empireName.includes('Qing')){
                empire.setStyle(setPolyStyle([148, 239, 45, 0.6]), get15Stroke([0, 0, 0, 1]))
            }
            if(empireName.includes('Akkadin')){
                empire.setStyle(setPolyStyle([204, 102, 0, 0.6], get15Stroke([0, 0, 0, 1])))
            }
            if(empireName.includes('British')){
                empire.setStyle(setPolyStyle([102, 255, 255, 0.6]), get15Stroke([0, 0, 0, 1]))
            }
        })
    }

    function setPolyStyle(fillColor, stroke){
        return new ol.style.Style({
            fill: new ol.style.Fill({
            color: fillColor
            }), 
            stroke: stroke
        })
    }
    
    function setPointStyle(fillColor, strokeFill, circleColor, radius, strokeCircle){
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: fillColor
                }),
            stroke: strokeFill,
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                    color: circleColor
                }),
                radius: radius,
                stroke: strokeCircle
            })
        })
    }

    function get15Stroke(color){
        return new ol.style.Stroke({
            color: color,
            width: 1.5
        })
    }
}
