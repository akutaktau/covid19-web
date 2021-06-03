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
            johor: { name: 'Johor', abbr: 'JHR', data: {}, pop: 3795300, color: 'rgba(164, 245, 173, 0.44)'},
            kedah: { name: 'Kedah', abbr: 'KDH', data: {}, pop: 2192800, color: 'rgba(9, 100, 19, 0.61)'},
            kelantan: { name: 'Kelantan', abbr: 'KTN', data: {}, pop: 1923000, color: 'rgba(180, 77, 141, 0.44)'},
            melaka: { name: 'Melaka', abbr: 'MLK', data: {}, pop: 935600, color: 'rgba(116, 117, 124, 0.44)' },
            'negeri-sembilan': { name: 'N. Sembilan', abbr: 'NSN', data: {}, pop: 1130400, color: 'rgba(228, 237, 32, 0.44)'},
            pahang: { name: 'Pahang', abbr: 'PHG', data: {}, pop: 1683300, color: 'rgba(130, 39, 39, 0.54)' },
            perak: { name: 'Perak', abbr: 'PRK', data: {}, pop: 2510200, color: 'rgba(237, 122, 32, 0.44)'},
            perlis: { name: 'Perlis', abbr: 'PLS', data: {}, pop: 255300, color: 'rgba(125, 209, 180, 0.44)'},
            'pulau-pinang': { name: 'Pulau Pinang', abbr: 'PNG', data: {}, pop: 1776700, color: 'rgba(16, 230, 216, 0.53)'},
            sabah: { name: 'Sabah', abbr: 'SBH', data: {}, pop: 3912600, color: 'rgba(23, 97, 150, 0.61)'},
            sarawak: { name: 'Sarawak', abbr: 'SRW', data: {}, pop: 2823300, color: 'rgba(233, 177, 24, 0.43)'},
            selangor: { name: 'Selangor', abbr: 'SGR', data: {}, pop: 6560900, color: 'rgba(187, 80, 191, 0.42)'},
            terengganu: { name: 'Terengganu', abbr: 'TRG', data: {}, pop: 1269700, color: 'rgba(20, 133, 238, 0.62)'},
            'wp-kuala-lumpur': { name: 'W.P. Kuala Lumpur', abbr: 'KUL', data: {}, pop: 1766700, color: 'rgba(237, 32, 124, 0.61)'},
            'wp-labuan': { name: 'W.P. Labuan', abbr: 'LBN', data: {}, pop: 99800, color: 'rgba(230, 78, 16, 0.53)'},
            'wp-putrajaya': { name: 'W.P. Putrajaya', abbr: 'PJY', data: {}, pop: 114900, color: 'rgba(16, 29, 230, 0.65)'},
        };

        this.data = [];
        const accumulatives = {};
        const trends = {};
        let yesterdayStr = null;
        let date = null;
        let dateStr = null;
        this.rawData.forEach((rawData, dateIndex) => {
            Object.keys(rawData).forEach(key => {
                if(key == 'date') {
                    if(dateStr) {
                        yesterdayStr = dateStr;
                    }
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
                    const newCase = rawData[key];

                    if(!trends[key]) {
                        trends[key] = {
                            new: new Array(18).fill(newCase),
                        };
                    }

                    trends[key].new.push(newCase);
                    trends[key].new.shift();

                    let r0 = 0;
                    if(yesterdayStr && states[key].data[yesterdayStr]) {
                        r0 = newCase / states[key].data[yesterdayStr].new;
                        if(!isFinite(r0)) {
                            r0 = 0;
                        }
                    }

                    accumulatives[key] = accumulatives[key] + newCase;
                    states[key].data[dateStr] = {
                        new: newCase,
                        r0,
                        rt: 0,
                        accu: accumulatives[key],
                        per100k: accumulatives[key] / states[key].pop * 100000,
                        newTrend: this.trend(trends[key].new) > 1 ? true : false,
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
            // calculate rt
            let rts = this.smooth(Object.keys(states[k].data).map(d => states[k].data[d].r0), 14);
            Object.keys(states[k].data).forEach((d, index) => {
                const rt = rts[index] ?? 0;
                states[k].data[d].rt = rt;

                if(!trends[k].rt) {
                    trends[k].rt = new Array(18).fill(rt);
                }

                trends[k].rt.push(rt);
                trends[k].rt.shift();

                states[k].data[d].rtTrend = this.trend(trends[k].rt) > 1 ? true : false;
            });

            // calculate total population
            totalPop += states[k].pop;

            // set latestData
            states[k].latestData = states[k].data[Object.keys(states[k].data).pop()];
        });
        my.pop = totalPop;

        Object.keys(states).forEach(k => {
            Object.keys(states[k].data).forEach(dateStr => {
                if(!my.data[dateStr]) {
                    my.data[dateStr] = { new: 0, accu: 0, per100k: 0, dca: 0, r0: 0, rt: 0, date: new Date(dateStr), rtTrend: false, newTrend: false };
                }

                my.data[dateStr].new = my.data[dateStr].new + states[k].data[dateStr].new;
                my.data[dateStr].accu = my.data[dateStr].accu + states[k].data[dateStr].accu;
                my.data[dateStr].per100k = my.data[dateStr].accu / my.pop * 100000;
                my.data[dateStr].r0 = my.data[dateStr].r0 + (states[k].data[dateStr].r0 / 16);
                my.data[dateStr].rt = my.data[dateStr].rt + (states[k].data[dateStr].rt / 16);
            });
        });


        const trend = { new: new Array(18).fill(0), rt: new Array(18).fill(0) };
        Object.keys(states.perlis.data).forEach(dateStr => {
            trend.new.push(my.data[dateStr].new);
            trend.new.shift();
            trend.rt.push(my.data[dateStr].rt);
            trend.rt.shift();

            my.data[dateStr].newTrend = this.trend(trend.new) > 1 ? true : false;
            my.data[dateStr].rtTrend = this.trend(trend.rt) > 1 ? true : false;
        });

        my.latestData = my.data[Object.keys(my.data).pop()];

        this.data.sort((prev, next) => prev.name > next.name ? 1 : -1);

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

    loadView(templateName, data, partials) {
        this.container.innerHTML = window.templates[templateName].render(data || {}, partials || {});
    }

    smooth(arr, windowSize, getter = (value) => value, setter) {
        const get = getter
        const result = []

        for (let i = 0; i < arr.length; i += 1) {
          const leftOffset = i - windowSize
          const from = leftOffset >= 0 ? leftOffset : 0
          const to = i + windowSize + 1

          let count = 0
          let sum = 0
          for (let j = from; j < to && j < arr.length; j += 1) {
            sum += get(arr[j])
            count += 1
          }

          result[i] = setter ? setter(arr[i], sum / count) : sum / count
        }

        return result
    }

    trend(arr, options) {
        options = options || {};
        options.lastPoints = options.lastPoints || 1;
        options.avgPoints = options.avgPoints || 14;

        if (arr.length < options.lastPoints + options.avgPoints) return null;

        var lastArr = options.reversed ? arr.slice(0, options.lastPoints) : arr.slice(arr.length - options.lastPoints, arr.length);
        var chartArr = options.reversed ? arr.slice(options.lastPoints, options.lastPoints+options.avgPoints) : arr.slice(arr.length - options.lastPoints - options.avgPoints, arr.length - options.lastPoints);

        var chartAvg = chartArr.reduce(function(res, val) { return res += val }) / chartArr.length;
        var lastAvg = Math.max.apply(null, lastArr);

        if (options.avgMinimum !== undefined && chartAvg < options.avgMinimum) return null;
        return lastAvg/chartAvg;
    }
}

window.CovidApp = new CovidApp(document.getElementById('content'));