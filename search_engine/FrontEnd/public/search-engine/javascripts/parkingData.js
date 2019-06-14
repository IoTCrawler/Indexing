$(document).ready(() => {
    new Chart(document.getElementsByClassName('line-chart'), {
        type: 'line',
        data: {
            labels: [1500, 1600, 1700, 1750, 1800, 1850, 1900, 1950, 1999, 2050],
            datasets: [{
                data: [86, 114, 106, 106, 107, 111, 133, 221, 783, 2478],
                label: 'Africa',
                borderColor: '#3e95cd',
                fill: false,
            },
            ],
        },
        options: {
            title: {
                display: true,
                text: 'World population per region (in millions)',
            },
        },
    });

    // Client side search function on the home page
    $('#myInput').on('keyup', function () {
        const value = $(this).val().toLowerCase();
        $('#myTable data').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });


    function loadParkingData() {
        $(document).ready(() => {
            $.get('/search-engine/parking/rawData', (response) => {
                let map; // Defining map
                const parkingIcon = '/search-engine/images/parking2.png'; // image source


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
                            console.log(props.nonHTHMLContent.garageCode);
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
                    const dataPoints = response.rawData;
                    const markersData = [];

                    for (let x = 0; x < response.rawData.length; x++) {
                        if (dataPoints[x].lat) {
                            // Create an array of markers
                            markersData.push({
                                coordinates: { lat: dataPoints[x].lat, lng: dataPoints[x].lng },
                                iconImage: parkingIcon,
                                content:
                                `<h6 id="parkSpaceHeader">${dataPoints[x].garageCode.toString()}</h6><hr>`
                                + '<p id="parkingAvailableSpaces">' + 'Available spaces: ' + `<b>${(dataPoints[x].totalSpaces - dataPoints[x].vehicleCount).toString()}</b></p>`
                                + '<p id="parkingLastUpdated">' + 'Last updated: ' + `<b>${dataPoints[x].date.toString()}</b></p>`,
                                nonHTHMLContent: {
                                    garageCode: dataPoints[x].garageCode.toString(),
                                    availableSpaces: (dataPoints[x].totalSpaces - dataPoints[x].vehicleCount).toString(),
                                    totalSpaces: dataPoints[x].totalSpaces.toString(),
                                    vehicleCount: dataPoints[x].vehicleCount.toString(),
                                    lastUpdated: dataPoints[x].date.toString(),
                                },
                            });
                        }
                    }

                    for (let i = 0; i < markersData.length; i++) {
                        // add marker
                        addMarker(markersData[i]);
                    }
                }

                initMap();
            });
        });
    }

    loadParkingData();
});
