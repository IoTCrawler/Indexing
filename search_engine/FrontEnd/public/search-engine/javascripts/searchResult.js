$(document).ready(() => {
    let userLat;
    let userLng;

    $.get('/search-engine/userCoordinates', (coords) => {
        userLat = Number(coords.lat);
        userLng = Number(coords.lng);
        console.log(userLat);
        console.log(userLng);
    });

    // TODO : Check this here
    $.get('/search-engine/dataSourceAirPollutionBanegardsgade', (recievedData) => {
        // Raw data
        const rawData = recievedData;

        // Process data
        const labels = [];
        const n02 = [];
        const n0x = [];
        const co = [];

        for (let x = 0; x < rawData.dataSource1.length; x++) {
            labels.push(rawData.dataSource1[x].Date);
            // labels.sort();
            n02.push(rawData.dataSource1[x].N02);
            n0x.push(rawData.dataSource1[x].NOx);
            co.push(rawData.dataSource1[x].CO);
        }

        // ChartJs Historic Data
        const ctx = document.getElementById('airPollutionBanegardsgadeChart').getContext('2d'); // Last Reading:
        const progress = document.getElementById('animationProgress');


        const chart = new Chart(ctx, {
            // The type of chart we want to create
            type: 'line',

            // The data for our dataset
            data: {
                labels: labels.reverse(),
                datasets: [{
                    data: n02,
                    label: 'NO2 myg/m3',
                    borderColor: '#3e95cd',
                    backgroundColor: '#4a4a4a',
                    fill: true,
                }, {
                    data: n0x,
                    label: 'NOx myg(NO2)/m3',
                    borderColor: '#8e5ea2',
                    backgroundColor: '#4a4a4a',
                    fill: true,
                }, {
                    data: co,
                    label: 'CO mg/m3',
                    borderColor: '#3cba9f',
                    backgroundColor: '#4a4a4a',
                    fill: true,
                },
                ],
            },

            // Configuration options go here
            options: {
                title: {
                    display: true,
                    text: 'World population per region (in millions)',
                },
                animation: {
                    // easing: 'easeInBack',
                    easing: 'easeOutBounce',
                    onProgress(animation) {
                        progress.value = animation.animationObject.currentStep / animation.animationObject.numSteps;
                    },
                },
            },
        });
    });

    function loadParkingData() {
        $.get('/search-engine/rawData', (response) => {
                let map; // Defining map
                const parkingIcon = '/search-engine/images/parking2.png'; // image source
                const gasIcon1 = '/search-engine/images/co2-purple.png'; // image source
                const gasIcon2 = '/search-engine/images/carbon-dioxide-red.png'; // image source
                // Setting the map central point
                const options = {
                    center: { lat: 56.1547347, lng: 10.2149063 },
                    // center: {lat: 56.156211, lng: 10.191191},
                    // zoom: 14
                    zoom: 14,
                };

                // Add Markers on the map
                function addMarker(props) {
                    // Add Marker
                    const marker = new google.maps.Marker({
                        position: props.coordinates,
                        map,
                        animation: google.maps.Animation.DROP,
                    });

                    // Check for custom icon
                    if (props.iconImage) {
                        // Set icon image
                        marker.setIcon(props.iconImage);
                    }

                    // Check content
                    if (props.content) {
                        const infoWindow = new google.maps.InfoWindow({
                            content: props.content,
                        });

                        marker.addListener('click', () => {
                            infoWindow.open(map, marker);
                        });

                        // When i click on the side nav i want you to show what i have clicked on the map
                        function onGarageCodeClick() {
                            // $(document).on('mouseenter', '.garageCode', function (event) {
                            $(document).on('mouseenter', '.card', (event) => {
                                const x = $(event.target).closest('.card').text();
                                if (x === props.nonHTHMLContent.garageCode) {
                                    infoWindow.open(map, marker);
                                } else {
                                    infoWindow.close(map, marker);
                                }
                            });
                        }

                        onGarageCodeClick();
                    }
                }

                function initMap() {
                    // New Map
                    map = new google.maps.Map(document.getElementById('map'), options);
                    const parkingSpacesDataPoints = response.rawData.parkingSpaces;
                    const dataPoints2 = response.rawData.airPollutionBanegardsgade;
                    const dataPoints3 = response.rawData.airPollutionBotanicalGarden;
                    const markersData = [];

                    // Parking spacce
                    if (parkingSpacesDataPoints) {
                        for (let x = 0; x < parkingSpacesDataPoints.length; x++) {
                            // Create an array of markers
                            markersData.push({
                                coordinates: { lat: parkingSpacesDataPoints[x].lat, lng: parkingSpacesDataPoints[x].lng },
                                iconImage: parkingIcon,
                                content:
                                `<h6 id="parkSpaceHeader">${parkingSpacesDataPoints[x].garageCode.toString()}</h6><hr>`
                                + '<p id="parkingAvailableSpaces">' + 'Available spaces: ' + `<b>${(parkingSpacesDataPoints[x].totalSpaces - parkingSpacesDataPoints[x].vehicleCount).toString()}</b></p>`
                                + '<p id="parkingLastUpdated">' + 'Last updated: ' + `<b>${parkingSpacesDataPoints[x].date.toString()}</b></p>`,
                                // This is used for on hover effect
                                nonHTHMLContent: {
                                    garageCode: parkingSpacesDataPoints[x].garageCode.toString(),
                                    availableSpaces:
                                        (parkingSpacesDataPoints[x].totalSpaces
                                            - parkingSpacesDataPoints[x].vehicleCount).toString(),
                                    totalSpaces: parkingSpacesDataPoints[x].totalSpaces.toString(),
                                    vehicleCount: parkingSpacesDataPoints[x].vehicleCount.toString(),
                                    lastUpdated: parkingSpacesDataPoints[x].date.toString(),
                                },
                            });
                        }
                    }
                    if (dataPoints2) {
                        for (let x = 0; x < dataPoints2.length; x++) {
                            // Create an array of markers
                            markersData.push({
                                coordinates: { lat: dataPoints2[x].lat, lng: dataPoints2[x].lng },
                                iconImage: gasIcon1,
                                content:
                                '<h6 id="parkSpaceHeader"> Air Pollution Banegardsgade </h6><hr>'
                                + '<p id="parkingLastUpdated">' + 'NO2: ' + `<b>${dataPoints2[x].N02}</b></p>`
                                + '<p id="parkingLastUpdated">' + 'NOx: ' + `<b>${dataPoints2[x].NOx}</b></p>`
                                + '<p id="parkingLastUpdated">' + 'CO: ' + `<b>${dataPoints2[x].CO}</b></p>`
                                + '<p id="parkingLastUpdated">' + 'Last updated: ' + `<b>${dataPoints2[x].Date.toString()}</b></p>`,
                            });
                        }
                    }

                    // Data source 3 - Air Pollution Botanical Garden
                    if (dataPoints3) {
                        for (let x = 0; x < dataPoints3.length; x++) {
                            // Create an array of markers
                            if (dataPoints3[x].O3 > 0) {
                                markersData.push({
                                    coordinates: { lat: dataPoints3[x].lat, lng: dataPoints3[x].lng },
                                    iconImage: gasIcon2,
                                    content:
                                    '<h6 id="parkSpaceHeader"> Air Pollution Botanical Garden </h6><hr>'
                                    + '<p id="parkingLastUpdated">' + 'NO2: ' + `<b>${dataPoints3[x].NO2}</b></p>`
                                    + '<p id="parkingLastUpdated">' + 'NOx: ' + `<b>${dataPoints3[x].NOx}</b></p>`
                                    + '<p id="parkingLastUpdated">' + 'O3: ' + `<b>${dataPoints3[x].O3}</b></p>`
                                    + '<p id="parkingLastUpdated">' + 'Last updated: ' + `<b>${dataPoints3[x].Date.toString()}</b></p>`,
                                });
                            }
                        }
                    }

                    // Place the coordinates that the user has typed i
                    if (true) {
                        markersData.push({
                            coordinates: { lat: userLat, lng: userLng },
                            content: '<p> This is the position that you picked</p>',
                        });
                    }

                    //          coordinates: {lat: 56.15961035462325, lng: 10.174093807629333},


                    for (let i = 0; i < markersData.length; i++) {
                        // add marker
                        addMarker(markersData[i]);
                    }
                }

                initMap();
            });
    }

    loadParkingData();

// Conditionally checking if the user clicks on a certain data type to enable or disable some fields
    const x = $('#sensorTypeSelect').prop('disabled');


    if (x) {
        $('#aarhusCityLabs').on('click', () => {
            $('#sensorTypeSelect').prop('disabled', false);
        });
    }

    $('#airPollutionBanegardsgade, #airPollutionBotanicalGarden, #parking').on('click', () => {
        $('#sensorTypeSelect').prop('disabled', true);
        $('#locationLat').prop('disabled', false);
        $('#locationLng').prop('disabled', false);
    });
});


/*
* 1 - When i click on the search button , i want you to search based on what i select and types
* 2 - Search my query depending on collection
* 3 - Plot my map based on my conditions
* */
