mapboxgl.accessToken = 'pk.eyJ1IjoibmVpbHNvbnMiLCJhIjoiY2xvaXluZXBnMDVqajJqcDhjNHQ2ejZjayJ9.ti3AShuCVZeeFzkHHp4WhQ';

const mapStyles = [
    'mapbox://styles/neilsons/clpha7y02006301opd43r857d',
    'mapbox://styles/neilsons/clplqwhdm00ak01recupzgx08'
];
let currentMapStyleIndex = 0;

const map = new mapboxgl.Map({
    container: 'map',
    style: mapStyles[currentMapStyleIndex],
    center: [-119.4179, 25.5853],
    zoom: 0.55,
});

let isSSTView = true;
let oceanCurrentsData;

function loadData() {
    return fetch('data/Major_Ocean_Currents.geojson')
        .then(response => response.json())
        .then(data => {
            oceanCurrentsData = data;
        });
}

function addDataLayer() {
    map.addSource('ocean-currents', {
        type: 'geojson',
        data: oceanCurrentsData,
    });

    map.addLayer({
        id: 'ocean-currents-layer',
        type: 'line',
        source: 'ocean-currents',
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
           
        },
        paint: {
            'line-width': 1.5,
            'line-opacity': 0.5,
            'line-color': [
                'case',
                ['==', ['get', 'TEMP'], 'warm'],
                
                isSSTView ? "#CF87B9" : '#2C2A2C',
                
                isSSTView ? '#81ADDA' : '#2C2A2C'
            ],
        },
    });
    
    

    map.once('data', () => {
        
        const source = map.getSource('ocean-currents');
        if (source) {
            source.setData(oceanCurrentsData);
        }
    });

    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        className: 'custom-popup-class',
    });

    function highlightFeature(e) {
        const currentName = e.features[0].properties.NAME;
        const temperature = e.features[0].properties.TEMP;

        map.setFilter('ocean-currents-layer-hover', ['==', 'NAME', currentName]);

        const popupContent = `
            <p>Current Name:
            <b>${currentName}</b></p>
            <p>Type: <b>${temperature}</b></p>`;

        popup.setHTML(popupContent)
            .setLngLat(e.lngLat)
            .addTo(map);
    }

    function resetHighlight() {
        map.setFilter('ocean-currents-layer-hover', ['==', 'NAME', '']);
        popup.remove();
    }

    map.on('mousemove', 'ocean-currents-layer', highlightFeature);
    map.on('mouseleave', 'ocean-currents-layer', resetHighlight);
}


map.on('style.load', function () {
    loadData().then(() => {
        addDataLayer();
    });
});

document.getElementById('toggleButton').addEventListener('click', function () {

    isSSTView = !isSSTView;

   
    const buttonText = isSSTView ? 'View SST' : 'View Bathymetry';
    document.getElementById('toggleButton').innerText = buttonText;

 
    currentMapStyleIndex = (currentMapStyleIndex + 1) % mapStyles.length;

   
    map.setStyle(mapStyles[currentMapStyleIndex]);

    
    map.flyTo({
        center: [-119.4179, 25.5853],
        zoom: 0.65,
    });

    
    loadData().then(() => {
        const source = map.getSource('ocean-currents');

        if (source) {
            source.setData(oceanCurrentsData);
        }

        const layerVisibility = isSSTView ? 'visible' : 'none';
        map.setLayoutProperty('ocean-currents-layer', 'visibility', layerVisibility);
    });
});


