export default class CovidChart {

    chartData = {
        labels: [],
    };

    dataKeys = {
        'perlis': 'perlis',
        'kedah': 'kedah',
        'perak': 'perak',
        'pulau-pinang': 'penang',
        'selangor': 'selangor',
        'wp-kuala-lumpur': 'kualalumpur',
        'negeri-sembilan': 'sembilan',
        'melaka': 'melaka',
        'johor': 'johor',
        'pahang': 'pahang',
        'terengganu': 'terengganu',
        'kelantan': 'kelantan',
        'wp-putrajaya': 'putrajaya',
        'sabah': 'sabah',
        'sarawak': 'sarawak',
        'wp-labuan': 'labuan',
    }

    dataLabels = {
        'Johor': 'johor',
        'Kedah': 'kedah',
        'Kelantan': 'kelantan',
        'Kuala Lumpur': 'kualalumpur',
        'Labuan': 'labuan',
        'Melaka': 'melaka',
        'Negeri Sembilan': 'sembilan',
        'Pahang': 'pahang',
        'Perak': 'perak',
        'Perlis': 'perlis',
        'Pulau Pinang': 'penang',
        'Putrajaya': 'putrajaya',
        'Selangor': 'selangor',
        'Terengganu': 'terengganu',
        'Sabah': 'sabah',
        'Sarawak': 'sarawak',
    }

    constructor(
        app,
        canvas,
        endDate,
        chartDuration,
        chartType,
        dataScope,
    ) {
        this.app = app;

        // canvas init
        this.chartInstance = null;
        this.canvas = canvas;

        // type init
        this.chartType = chartType;

        // date init
        const fromDate = new Date(endDate.getTime());
        fromDate.setDate(fromDate.getDate() + chartDuration);
        this.startDate = fromDate;
        this.endDate = endDate;

        // show only one state chart
        if(dataScope && this.dataLabels[dataScope]) {
            // contoh dataScope = Kuala Lumpur;
            this.dataScope = Object.keys(this.dataKeys)
                .filter(key => this.dataKeys[key] == this.dataLabels[dataScope])
                .pop();

            const originalValue = this.dataLabels[dataScope];
            this.dataLabels = {};
            this.dataLabels[dataScope] = originalValue;
        }

        // build chart
        this.filterRange();
        this.buildChart();
        this.bindEvents();
    }

    filterRange() {
        this.chartData = {
            labels: [],
            data: {},
        };

        let masterData = this.app.data;
        if(this.dataScope) {
            masterData = this.app.data.filter(o => o.name == this.dataScope);
        }

        masterData.forEach(stateObject => {
            Object.keys(stateObject.data).forEach(dateString => {
                const date = new Date(dateString);
                if(date >= this.startDate && date <= this.endDate) {
                    const label = (date.getDate()) + '/' + (date.getMonth() + 1);
                    if(this.chartData.labels.indexOf(label) == -1) {
                        this.chartData.labels.push(label);
                    }
                    if (!this.chartData.data[stateObject.name]) {
                        this.chartData.data[stateObject.name] = [];
                    }

                    switch(this.chartType) {
                        case 'case':
                            this.chartData.data[stateObject.name].push(stateObject.data[dateString].new);
                            break;
                        case 'per100k':
                            this.chartData.data[stateObject.name].push(Math.round(stateObject.data[dateString].per100k));
                            break;
                        case 'rt':
                            this.chartData.data[stateObject.name].push(stateObject.data[dateString].rt.toFixed(2));
                            break;
                    }
                }
            });
        });
    }

    buildChart() {
        this.canvas.style.height = '500px';
        this.chart = new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.chartData.labels,
                datasets: Object.keys(this.chartData.data).map(label => {
                    return {
                        label,
                        data: this.chartData.data[label],
                    }
                }),
            },
            options: {
                elements: {
                    line: {
                        tension: 0
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    colorschemes: {
                        scheme: 'office.Genesis6'
                    }
                },
                legend: {
                    display: true,
                    position: "bottom",
                }
            }
        });
    }

    destroy() {
        this.chart.destroy();
    }

    bindEvents() {
        document.querySelector('#toggle').addEventListener('click', (event) => {
            if (this.chart) {
                this.chart.data.datasets.forEach(dataset => {
                    Object.keys(dataset._meta).forEach(key => {
                        const current = !dataset._meta[key].hidden
                        dataset._meta[key].hidden = current || null
                    })
                });
                try {
                    this.chart.update();
                } catch(e){}
            }
        });
    }
}