import { HomeController } from './controllers.js';
import { Router } from './router.js';

class CovidApp {

    controllers = {};
    data = [];
    rawData = [];
    container;

    constructor(outputElement) {
        this.container = outputElement;
        this.initialize();
    }

    async initialize() {
        await this.getData();
        this.initializeRouter();
    }

    async getData() {
        await fetch('https://raw.githubusercontent.com/akutaktau/covid-19-data/main/covid-19-states-daily-cases.json')
            .then(r => r.json())
            .then(data => this.rawData = data);

        this.processData();
    }

    processData() {
        const states = {
            johor: { name: 'Johor', abbr: 'JHR', data: {}, pop: 3795300, },
            kedah: { name: 'Kedah', abbr: 'KDH', data: {}, pop: 2192800, },
            kelantan: { name: 'Kelantan', abbr: 'KTN', data: {}, pop: 1923000, },
            melaka: { name: 'Melaka', abbr: 'MLK', data: {}, pop: 935600, },
            'negeri-sembilan': { name: 'N. Sembilan', abbr: 'NSN', data: {}, pop: 1130400, },
            pahang: { name: 'Pahang', abbr: 'PHG', data: {}, pop: 1683300, },
            perak: { name: 'Pahang', abbr: 'PRK', data: {}, pop: 2510200, },
            perlis: { name: 'Perlis', abbr: 'PLS', data: {}, pop: 255300, },
            'pulau-pinang': { name: 'Pulau Pinang', abbr: 'PNG', data: {}, pop: 1776700, },
            sabah: { name: 'Sabah', abbr: 'SBH', data: {}, pop: 3912600, },
            sarawak: { name: 'Sarawak', abbr: 'SRW', data: {}, pop: 2823300, },
            selangor: { name: 'Selangor', abbr: 'SGR', data: {}, pop: 6560900, },
            terengganu: { name: 'Terengganu', abbr: 'TRG', data: {}, pop: 1269700, },
            'wp-kuala-lumpur': { name: 'W.P. Kuala Lumpur', abbr: 'KUL', data: {}, pop: 1766700, },
            'wp-labuan': { name: 'W.P. Labuan', abbr: 'LBN', data: {}, pop: 99800, },
            'wp-putrajaya': { name: 'W.P. Putrajaya', abbr: 'PJY', data: {}, pop: 114900, },
        };

        this.data = [];
        const accumulatives = {};
        const dailyCases = {};
        const rnaughts = {};
        const dailyCaseRunningAverage = 7;
        const rnaughtRunningAverage = 14;

        this.rawData.forEach(rawData => {
            let date = null;
            let dateStr = null;
            Object.keys(rawData).forEach(key => {
                if(key == 'date') {
                    date = new Date(rawData[key]);
                    dateStr = date.toISOString();
                } else {
                    // setup data
                    if(this.data.indexOf(states[key]) == -1) {
                        this.data.push(states[key]);
                    }
                    if(!accumulatives[key]) {
                        accumulatives[key] = 0;
                    }
                    if(!dailyCases[key]) {
                        dailyCases[key] = [];
                    }
                    if(!rnaughts[key]) {
                        rnaughts[key] = [];
                    }

                    const newCase = rawData[key];

                    let dca = 0;
                    let rnaught = 0;
                    if(dailyCases[key].length > dailyCaseRunningAverage - 1) {
                        dca = dailyCases[key].reduce((pv, cv) => pv + cv, 0) / dailyCases[key].length;

                        if(isNaN(dca) || !isFinite(dca)) {
                            dca = 0;
                        }

                        rnaught = newCase / dca;
                        if(isNaN(rnaught) || !isFinite(rnaught)) {
                            rnaught = 0;
                        }
                    }

                    dailyCases[key].push(newCase);
                    if(dailyCases[key].length > dailyCaseRunningAverage) {
                        dailyCases[key].shift();
                    }

                    let rt = 0;

                    if(rnaughts[key].length > rnaughtRunningAverage - 1) {
                        rt = rnaughts[key].reduce((pv, cv) => pv + cv, 0) / rnaughts[key].length;
                        if(isNaN(rt) || !isFinite(rt)) {
                            rt = 0;
                        }
                    }

                    rnaughts[key].push(rnaught);
                    if(rnaughts[key].length > rnaughtRunningAverage) {
                        rnaughts[key].shift();
                    }

                    accumulatives[key] = accumulatives[key] + newCase;
                    states[key].data[dateStr] = {
                        new: newCase,
                        dca,
                        r0: rnaught,
                        rt,
                        accu: accumulatives[key],
                        per100k: accumulatives[key] / states[key].pop * 100000,
                        date,
                    };
                }
            });
        });

        const my = {
            name: 'Malaysia',
            abbr: 'MYS',
            data: {},
            pop: 0
        }

        let totalPop = 0;
        Object.keys(states).forEach(k => {
            totalPop += states[k].pop;
            states[k].latestData = states[k].data[Object.keys(states[k].data).pop()];
        });
        my.pop = totalPop;

        Object.keys(states).forEach(k => {
            Object.keys(states[k].data).forEach(dateStr => {
                if(!my.data[dateStr]) {
                    my.data[dateStr] = { new: 0, accu: 0, per100k: 0, dca: 0, r0: 0, rt: 0, date: new Date(dateStr) };
                }

                my.data[dateStr].new = my.data[dateStr].new + states[k].data[dateStr].new;
                my.data[dateStr].accu = my.data[dateStr].accu + states[k].data[dateStr].accu;
                my.data[dateStr].per100k = my.data[dateStr].accu / my.pop * 100000;
                my.data[dateStr].dca = my.data[dateStr].dca + states[k].data[dateStr].dca;
                my.data[dateStr].r0 = my.data[dateStr].r0 + (states[k].data[dateStr].r0 / 16);
                my.data[dateStr].rt = my.data[dateStr].rt + (states[k].data[dateStr].rt / 16);
            });
        });

        my.latestData = my.data[Object.keys(my.data).pop()];

        this.myData = my;
    }

    initializeRouter() {
        // load controllers
        this.controllers.home = new HomeController(this);
        const app = this;
        const router = new Router();

        // load routes
        router.add({path: '#/', on: function() {
            app.controllers.home.index.call(app.controllers.home);
        }});

        router.add({path: '#/:state', on: function(state) {
            app.controllers.home.show.call(app.controllers.home, decodeURIComponent(this.params.state));
        }});

        // resove current route
        router.init(null, () => {});
    }

    loadView(templateName, data) {
        this.container.innerHTML = window.templates[templateName].render(data || {});
    }
    }
}

window.CovidApp = new CovidApp(document.getElementById('content'));