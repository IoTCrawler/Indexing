function initMap() {
    const map = new google.maps.Map(document.getElementById('mapOverview'), {
        zoom: 11,
        center: { lat: 56.1629, lng: 10.2039 },
    });

    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
}

initMap();
