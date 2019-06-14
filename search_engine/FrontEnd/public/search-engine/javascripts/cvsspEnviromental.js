// const ctx = document.getElementById('myChart');
const pir3Readings = [];
let rawData;


myChart;

function getPIRTwoData() {
    const pir2Readings = [];
    const values = [];
    $.get('/search-engine/liveEnvironmentalCVSSP/pirTwo', (data) => {
        data.items.forEach((element) => {
            pir2Readings.push(element);
            values.push(element.value);
        });
        values.forEach((value) => {
            console.log(value);
        });
    });
}


function getPIRThreeData() {
    $.get('/search-engine/liveEnvironmentalCVSSP/pirThree', (data) => {
        data.items.forEach((element) => {
            pir3Readings.push(element);
        });
    });
}

function getDoorTwoDatat() {
    $.get('/search-engine/liveEnvironmentalCVSSP/latestReading', (data) => {
        console.log(data.items.length);

        const labels = [];
        const n02 = [];

        for (let x = 0; x < data.items.length; x++) {
            labels.push(data.items[x].timestamp);
            n02.push(data.items[x].value);
            // n0x.push(rawData.rawData[x].NOx);
            // O3.push(rawData.rawData[x].O3);
        }
        console.log(n02)


        var ctx = document.getElementById('myChart');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: n02,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(235, 159, 64, 1)',
                        'rgba(25, 159, 14, 1)',
                        'rgba(155, 159, 24, 1)',
                        'rgba(165, 159, 34, 1)',
                        'rgba(135, 159, 44, 1)',
                    ],
                    borderColor: [
                        'rgba(255,99,132,1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(235, 159, 64, 1)',
                        'rgba(25, 159, 14, 1)',
                        'rgba(155, 159, 24, 1)',
                        'rgba(165, 159, 34, 1)',
                        'rgba(135, 159, 44, 1)',
                    ],
                    borderWidth: 1,
                }],
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                        },
                    }],
                },
                title: {
                    display: true,
                    text: 'CVSSP Live Living Lab Data ',
                },
                animation: {
                    // easing: 'easeInBack',
                    easing: 'easeOutBounce',
                },
            },
        });


    });
}

getPIRTwoData();
getPIRThreeData();
getDoorTwoDatat();
