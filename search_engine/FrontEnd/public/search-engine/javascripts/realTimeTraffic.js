$(document).ready(() => {
    const filteredData = [];
    let filteredData2 = [];
    let streetNames = [];
    let trafficData = [];
    let selectedStreetName;
    let searchResult = null;
    let colour = '';
    let POINT_1_LAT;
    let POINT_1_LNG;
    let POINT_2_LAT;
    let POINT_2_LNG;

    function loadTrafficData() {
        // Get the traffic data first
        $.get('/search-engine/realTimeTraffic/rawData', (trafficDataResponse) => {
            trafficData = trafficDataResponse;
            $.get('/search-engine/realTimeTrafficRoute/rawData', (realTimeTrafficRouteResponse) => {
                for (let x = 0; x < realTimeTrafficRouteResponse.rawData.length; x++) {
                    /** we are only interested in looking at data
                    that a complete route from start to end points */
                    if (realTimeTrafficRouteResponse.rawData[x].POINT_1_CITY !== null
                        && realTimeTrafficRouteResponse.rawData[x].POINT_1_LAT !== null) {
                        filteredData.push(realTimeTrafficRouteResponse.rawData[x]);
                    }
                    /** Filtering all of the street name from our search results */
                    if (realTimeTrafficRouteResponse.rawData[x].POINT_1_STREET !== null
                        && realTimeTrafficRouteResponse.rawData[x].POINT_2_STREET !== null) {
                        streetNames.push(realTimeTrafficRouteResponse.rawData[x].POINT_1_STREET);
                        streetNames.push(realTimeTrafficRouteResponse.rawData[x].POINT_2_STREET);
                        // this filters out all duplicate value
                        streetNames = [...new Set(streetNames)];
                        filteredData2.push(realTimeTrafficRouteResponse.rawData[x]);
                        filteredData2 = [...new Set(filteredData)];
                    }
                }

                /** Push all of the street name on the drop down list */
                 $.each(streetNames, (key, value) => {
                    $('#townSelectList').append($('<option>', {
                        text: value,
                    }));
                });

                function calculateAndDisplayRoute(directionsService, directionsDisplay) {
                    // const selectedMode = document.getElementById('mode').value;

            /*        /!** Condition checker for search box Start *!/
                    $('#streetNameSearch').on('click', () => {
                        // userInput = $('#streetNameInput').val().replace(/\s/g, '');
                        userInput = $('#streetNameInput').val();
                        if (streetNames.includes(userInput)) {
                            $('#searchResultLocation').text(userInput);
                            $('#displayHeader').text(userInput);
                        } else {
                            console.log('nothing yet buddy');
                        }

                        for (let y = 0; y < filteredData.length; y++) {
                            if (userInput === filteredData[y].POINT_1_STREET
                                || userInput === filteredData[y].POINT_2_STREET) {
                                searchResult = filteredData[y];
                            }
                        }

                        POINT_1_LAT = Number(searchResult.POINT_1_LAT);
                        POINT_1_LNG = Number(searchResult.POINT_1_LNG);
                        POINT_2_LAT = Number(searchResult.POINT_2_LAT);
                        POINT_2_LNG = Number(searchResult.POINT_2_LNG);

                        let flow;
                        let selectedReading;

                        for (let i = 0; i < trafficDataResponse.rawData.length; i++) {
                            $('#resultTimeStamp').text(trafficDataResponse.rawData[i].TIMESTAMP);
                            $('#resultTimeStamp').text(trafficDataResponse.rawData[i].TIMESTAMP);
                            $('#resultTraffic').text(trafficDataResponse.rawData[i].trafficStatus);

                            if (searchResult.REPORT_ID
                                === trafficDataResponse.rawData[i].REPORT_ID) {
                                flow = Number(trafficDataResponse.rawData[i].avgSpeed);
                                selectedReading = trafficDataResponse.rawData[i];
                            }
                        }


                        directionsService.route({
                            origin: { lat: POINT_1_LAT, lng: POINT_1_LNG }, // Haight.
                            destination: { lat: POINT_2_LAT, lng: POINT_2_LNG }, // Ocean Beach.
                            travelMode: google.maps.DirectionsTravelMode.DRIVING,
                            // travelMode: google.maps.TravelMode[selectedMode],
                        }, (response, status) => {
                            if (status === 'OK') {
                                directionsDisplay.setDirections(response);
                            } else {
                                window.alert(`Directions request failed due to ${status}`);
                            }
                        });
                    });
                    /!** Condition checker for search box end *!/ */

                    /** Condition checker for search box Start */
                    $('#townSelectList').on('change', () => {
                        selectedStreetName = $('#townSelectList option:selected').val();
                        $('#searchResultLocation').text(selectedStreetName);
                        $('#displayHeader').text(selectedStreetName);

                        for (let y = 0; y < filteredData.length; y++) {
                            if (selectedStreetName === filteredData[y].POINT_1_STREET
                                || selectedStreetName === filteredData[y].POINT_2_STREET) {
                                searchResult = filteredData2[y];
                                console.log(JSON.stringify(searchResult));
                            }

                            // searchResult = filteredData[y];
                        }

                        POINT_1_LAT = Number(searchResult.POINT_1_LAT);
                        POINT_1_LNG = Number(searchResult.POINT_1_LNG);
                        POINT_2_LAT = Number(searchResult.POINT_2_LAT);
                        POINT_2_LNG = Number(searchResult.POINT_2_LNG);

                        let flow;
                        let selectedReading;

                        for (let i = 0; i < trafficDataResponse.rawData.length; i++) {
                            $('#resultTimeStamp').text(trafficDataResponse.rawData[i].TIMESTAMP);
                            $('#resultTraffic').text(trafficDataResponse.rawData[i].trafficStatus);
                            // console.log(trafficDataResponse.rawData[i]);

                            if (searchResult.REPORT_ID
                                === trafficDataResponse.rawData[i].REPORT_ID) {
                                flow = Number(trafficDataResponse.rawData[i].avgSpeed);
                                selectedReading = trafficDataResponse.rawData[i];
                            }
                        }

                        directionsService.route({
                            origin: { lat: POINT_1_LAT, lng: POINT_1_LNG }, // .
                            destination: { lat: POINT_2_LAT, lng: POINT_2_LNG }, // .
                            travelMode: google.maps.DirectionsTravelMode.DRIVING,
                            // travelMode: google.maps.TravelMode[selectedMode],
                        }, (response, status) => {
                            if (status === 'OK') {
                                directionsDisplay.setDirections(response);
                            } else {
                                window.alert(`Directions request failed due to ${status}`);
                            }
                        });
                    });
                    /** Condition checker for search box End */
                }


                const polylineOptionsActual = new google.maps.Polyline({
                    strokeColor: colour,
                    strokeWeight: 5,
                });

                function initMap() {
                    const directionsDisplay = new google.maps.DirectionsRenderer({
                        polylineOptions: polylineOptionsActual,
                    });
                    const directionsService = new google.maps.DirectionsService();
                    const map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 11,
                        center: { lat: 56.1629, lng: 10.2039 },
                    });
                    directionsDisplay.setMap(map);

                    calculateAndDisplayRoute(directionsService, directionsDisplay);
                }

                initMap();
            });
        });
    }
    loadTrafficData();
});
