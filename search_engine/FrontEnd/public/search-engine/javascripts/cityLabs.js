$(document).ready(() => {
    let dataSource1;
    let dataSource2;
    let dataSource3;
    let seletedSensor;
    let selectedSensorType;

    /* When i change my selection please do the following // select sensor  */
    $('#sensorID').on('change', () => {
        selectedSensorType = $('#sensorID option:selected').val();
        const resetReadingType = $('#example option:first').prop('selected', true);

        const display1 = $('#cityLabsSensorType').text('-');
        const display2 = $('#cityLabsSensorValue').text('-');
        const display3 = $('#cityLabTime').text('-');

        if (selectedSensorType === '0004A30B001E307C') {
            resetReadingType;
            display1;
            display2;
            display3;
        } else if (selectedSensorType === '0004A30B001E8EA2') {
            resetReadingType;
            display1;
            display2;
            display3;
        } else if (selectedSensorType === '0004A30B001E1694') {
            resetReadingType;
            display1;
            display2;
            display3;
        }
    });

    const value = [];
    const date = [];

    /* When i change my selection please do the following // select reading Type */
    $('#example').on('change', () => {
        seletedSensor = $('select#sensor option').filter(':selected').val();
        $.get('/search-engine/aarhusCityLabs/rawData', (response) => {
            // Sensor 1
            for (let x = 0; x < response.rawData.length; x++) {
                if (response.rawData[x].sensor === selectedSensorType) {
                    dataSource1 = response.rawData[x];
                    const type = response.rawData[x].type;
                    if (seletedSensor === type) {
                        $('#cityLabsSensorType').text(response.rawData[x].type);
                        $('#cityLabsSensorValue').text(response.rawData[x].value);
                        value.push(response.rawData[x].value);
                        date.push(response.rawData[x].time);
                        $('#cityLabTime').text(response.rawData[x].time);
                    }
                }
            }

            /* Chart start here */
            new Chart(document.getElementsByClassName('line-chart'), {
                type: 'line',
                data: {
                    labels: date,
                    datasets: [{
                        data: value,
                        label: seletedSensor,
                        borderColor: '#6db8ff',
                        fill: true,
                    },
                    ],
                },
                options: {
                    title: {
                        display: true,
                        text: `Displaying data from${date[0]} to ${date[date.length - 1]}`,
                        position: 'top',
                    },
                },
            });
            /* Chart end here */
            console.log(value);
        });
        setTimeout(() => {
            value.splice(0);
            date.splice(0);
        }, 2000);
    });


    const citymap = {
        vancouver: {
            center: { lat: 56.151924, lng: 10.213474 },
        },
    };

    function initMap() {
        // Create the map.
        const directionsDisplay = new google.maps.DirectionsRenderer();
        const directionsService = new google.maps.DirectionsService();
        const map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: { lat: 56.151924, lng: 10.213474 },
            mapTypeId: 'terrain',
        });
        directionsDisplay.setMap(map);

        calculateAndDisplayRoute(directionsService, directionsDisplay);
        document.getElementById('mode').addEventListener('change', () => {
            calculateAndDisplayRoute(directionsService, directionsDisplay);
        });

        function calculateAndDisplayRoute(directionsService, directionsDisplay) {
            const selectedMode = document.getElementById('mode').value;
            directionsService.route({
                origin: { lat: 56.153542, lng: 10.213968 }, // Haight.
                destination: { lat: 56.159848, lng: 10.216892 }, // Ocean Beach.
                // origin: { lat: POINT_1_LAT, lng: POINT_1_LNG }, // Haight.
                // destination: { lat: POINT_2_LAT, lng: POINT_2_LNG }, // Ocean Beach.
                // Note that Javascript allows us to access the constant
                // using square brackets and a string value as its
                // "property."
                travelMode: google.maps.TravelMode[selectedMode],
            }, (response, status) => {
                if (status === 'OK') {
                    directionsDisplay.setDirections(response);
                } else {
                    window.alert(`Directions request failed due to ${status}`);
                }
            });
        }

        // Construct the circle for each value in citymap.
        // Note: We scale the area of the circle based on the population.
        for (const city in citymap) {
            // Add the circle for this city to the map.
            const cityCircle = new google.maps.Circle({
                // strokeColor: '#FF0000',
                strokeColor: '#231fab',
                strokeOpacity: 0.9,
                strokeWeight: 2,
                fillColor: '#dbf8ff',
                fillOpacity: 0.35,
                map,
                center: citymap[city].center,
                radius: 1500,
                // radius: Math.sqrt(citymap[city].population) * 100
            });
        }
    }

    initMap();


    /* Search function start */

    // Client side search function
    $('#myInput').on('keyup', function () {
        const value = $(this).val().toLowerCase();
        $('#myTable data').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
    /* Search function end */
});


/*
Data is retrieved from sensors located between Dokk1 and Navitas.
The resources consist of measurements for the respective sizes
 at the specified time in UTC. However,
Zthe times are rounded down to the nearest 5 minute period
and if there are several measurements from the period the
value is an average.
There are data from August 18, 2016 with the exception of
the period from November 22 to December 6, 2016, where no data has been collected.
Upload takes place every 15 minutes
* */
