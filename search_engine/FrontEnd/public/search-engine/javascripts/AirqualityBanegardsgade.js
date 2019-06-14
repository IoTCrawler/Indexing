// Globals
let rawData;

function loadDataTables() {
    $(document)
        .ready(function () {
            $('#dataTables')
                .DataTable({
                    'iDisplayLength': 5
                });
        });
}

loadDataTables();

function loadHistoricData() {
    $.get('/search-engine/airPollutionBanegardsgade/rawData', (recievedData) => {
        // Raw data
        rawData = recievedData;

        // Process data


        const labels = [];
        const n02 = [];
        const n0x = [];
        const co = [];

        for (let x = 0; x < rawData.rawData.length; x++) {
            labels.push(rawData.rawData[x].Date);
            // labels.sort();
            n02.push(rawData.rawData[x].N02);
            n0x.push(rawData.rawData[x].NOx);
            co.push(rawData.rawData[x].CO);
        }


        // ChartJs Historic Data
        const ctx = document.getElementById('historicAirPollution')
            .getContext('2d'); // Last Reading:
        document.getElementById('lastReading1').innerText = `Last Reading: ${labels.slice(-1)[0]}`;
        document.getElementById('lastReading2').innerText = `Last Reading: ${labels.slice(-1)[0]}`;
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


        // Google Data
        google.charts.load('current', { packages: ['gauge'] });
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {
            const data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['NO2', n02.slice(-1)[0]],
                ['NOx', n0x.slice(-1)[0]],
                ['CO', co.slice(-1)[0]],
            ]);

            const options = {
                width: 1900,
                height: 240,
                redFrom: 90,
                redTo: 100,
                yellowFrom: 75,
                yellowTo: 90,
                minorTicks: 10,
            };

            const chart = new google.visualization.Gauge(document.getElementById('chart_div2'));

            chart.draw(data, options);
        }
    });
}

loadHistoricData();
