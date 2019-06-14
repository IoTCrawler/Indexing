$(document).ready(() => {
    /* Map Start */

    // In the following example, markers appear when the user clicks on the map.
    // The markers are stored in an array.
    // The user can then click an option to hide, show or delete the markers.
    let map;
    let markers = [];

    function initMap() {
        const cityOfAarhus = { lat: 56.1547347, lng: 10.2149063 };

        map = new google.maps.Map(document.getElementById('mapPicker'), {
            zoom: 14, // Set the zoom level manually
            center: cityOfAarhus,
            draggable: true,
            mapTypeId: 'terrain',
        });

        // This event listener will call addMarker() when the map is clicked.
        map.addListener('click', (event) => {
            if (markers.length >= 1) {
                deleteMarkers();
            }

            addMarker(event.latLng);
            document.getElementById('locationLat').value = event.latLng.lat();
            document.getElementById('locationLng').value = event.latLng.lng();
        });
    }

    // Adds a marker to the map and push to the array.
    function addMarker(location) {
        const marker = new google.maps.Marker({
            position: location,
            map,
        });
        markers.push(marker);
    }

    // Sets the map on all markers in the array.
    function setMapOnAll(map) {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }

    // Removes the markers from the map, but keeps them in the array.
    function clearMarkers() {
        setMapOnAll(null);
    }

    // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
        clearMarkers();
        markers = [];
    }

    initMap();
    /* Map End */


    /** Location start v */

    $('#locationInput').on('input', (e) => {
        if ($('#locationInput').val() !== 'City Of Aarhus') {
            $('#locationInput').val('City Of Aarhus');
        }
    });
    /** Location end * */

    /** Data type start * */
        // Get selected text
    const dataTypeSelection = $('#dataTypeSelection').find(':selected').text();
    $('#readingTypeInput').val(dataTypeSelection);

    $('#dataTypeSelection').change(() => {
        const dataTypeSelection = $('#dataTypeSelection').find(':selected').text();
        $('#readingTypeInput').val(dataTypeSelection);
        if (dataTypeSelection !== 'Traffic') {
            $('#formSearch').attr('action', '/search-engine/searchResults');
        }

        if (dataTypeSelection === 'Environmental') {
            $('#dataTypeSelect').find($('option')).attr('selected', false);
            $('#dataTypeSelect').children('[value="airPollutionBanegardsgade"]').attr('selected', true);
            $('#dataTypeSelect').children('[value="airPollutionBotanicalGarden"]').attr('selected', true);
        } else if (dataTypeSelection === 'Parking') {
            $('#dataTypeSelect').find($('option')).attr('selected', false);
            $('#dataTypeSelect').children('[value="parkingSpaces"]').attr('selected', true);
        } else if (dataTypeSelection === 'Parking') {
            $('#dataTypeSelect').find($('option')).attr('selected', false);
            $('#dataTypeSelect').children('[value="parkingSpaces"]').attr('selected', true);
        }

        $('#dataTypeSelection').close();
    });
    /** Data type  end * */

    /* Pattern type start */
    const patternTypeSelection = $('#patternSelection').find(':selected').text();
    $('#patternTypeInput').val(patternTypeSelection);

    $('#patternMultiCollapse').change(() => {
        const patternTypeSelection = $('#patternSelection').find(':selected').text();
        $('#patternTypeInput').val(patternTypeSelection);
    });
    /* Pattern type end */

    /* Time Range Start */
    const timeSelectionDefault = $('#timeRangeMultiCollapse').find(':selected').text();
    $('#timeRangeInput').val(timeSelectionDefault);


    $('#timeRangeMultiCollapse').change(() => {
        const timeSelection = $('#timeRangeMultiCollapse').find(':selected').text();
        $('#timeRangeInput').val(timeSelection);
    });

    /* Time Range End */


    /* initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values: */
    autocomplete(document.getElementById('myInput'), countries);
    autocomplete(document.getElementById('readingTypeInput'), readingType);
});
