var sentLatLong = [false, "NIL", "NIL"]

function savePosition(position) {
    console.log("savePosition called");
    sentLatLong = [true, position.coords.latitude, position.coords.longitude];
    console.log(sentLatLong);
};

const long = document.currentScript.getAttribute("long"); 
const lat = document.currentScript.getAttribute("lat"); 
const ripenessFilter = document.currentScript.getAttribute("ripenessFilter"); 

navigator.geolocation.getCurrentPosition((position) => {
    savePosition(position);
    console.log(sentLatLong);

    console.log("Loading Maps");
    console.log(sentLatLong);
    
    if (sentLatLong[0] === false || sentLatLong[1] === "NIL" || sentLatLong[2] === "NIL") {
        sentLatLong = [false, long, lat]
    }
    
    console.log("After if");
    console.log(sentLatLong);
    console.log([parseFloat(sentLatLong[1]), parseFloat(sentLatLong[2])]);

    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VyYWxkeWVvIiwiYSI6ImNsNnlwY3UyMzB0eGkzZHBiYnU2N3dyc2IifQ.M0h9Pgr1Nq4q7KSbNQIeFg';
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: [parseFloat(sentLatLong[2]), parseFloat(sentLatLong[1])], // starting position [lng, lat]
        zoom: 12, // starting zoom
        projection: 'globe' // display the map as a 3D globe
    });
    map.on('load', () => {
        // Add a new source from our GeoJSON data and
        // set the 'cluster' option to true. GL-JS will
        // add the point_count property to your source data.
        map.addSource('geobanana', {
            type: 'geojson',
            // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
            // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
            data: geobanana,
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });
        
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'geobanana',
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                    ],
                    'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                40
                ]
            }
        });
        
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'geobanana',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });
        
        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'geobanana',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#11b4da',
                'circle-radius': 4,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
        
        // inspect a cluster on click
        map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
            });
            const clusterId = features[0].properties.cluster_id;
            map.getSource('geobanana').getClusterExpansionZoom(
                clusterId,
                (err, zoom) => {
                    if (err) return;
                    
                    map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                    });
                }
            );
        });
        
        // When a click event occurs on a feature in
        // the unclustered-point layer, open a popup at
        // the location of the feature, with
        // description HTML from its properties.
        map.on('click', 'unclustered-point', (e) => {
            console.log("clicked");
            console.log(e);
            const coordinates = e.features[0].geometry.coordinates.slice();
            // const ripeness = e.ripeness;
            // const user = e.user;
            // const dateStt = new Date(e.date);
            // const date = dateStt.toString();
            // const bananaCoord =  e.location;
            // const bananaLoc = e.locationGuess;
            
            // Ensure that if the map is zoomed out such that
            // multiple copies of the feature are visible, the
            // popup appears over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
            
            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                `A${ripenessFilter} banana was found at coodindates ${e.lngLat.lng} (longitude), ${e.lngLat.lat} (latitude)`
                )
            .addTo(map);
        });
        
        map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
        });
    });
});