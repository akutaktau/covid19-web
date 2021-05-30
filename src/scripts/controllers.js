import CovidChart from './chart.js';
import CovidDatatable from './datatable.js';

export class HomeController {
    constructor(app) {
        this.app = app;
        this.bindGlobalEvents();
    }

    index() {
        const dateStr = this.app.myData.latestData.date.toISOString().substr(0, 10);
        this.currentDate = new Date(dateStr);
        this.chartType = 'case';
        this.chartDuration = -30;
        this.renderIndex();
    }

    renderIndex() {
        this.app.loadView('home', {
            date: this.currentDate.toISOString().substr(0, 10),
            stats: this.calculateStats(),
        });
        this.stateDataContainer = document.getElementById('state-data');
        this.loadDatatable();
        this.loadChart();
        this.bindHomeEvents();
    }

    calculateStats() {
        const fullDateStr = this.currentDate.toISOString();
        let data = {
            new: 'Tiada Data',
            per100k: 0,
            rt: 0,
        }
        if(this.app.myData.data[fullDateStr]) {
            data = this.app.myData.data[fullDateStr];
        }
        return {
            new: data.new,
            per100k: Math.round(data.per100k),
            rt: data.rt.toFixed(2),
        }
    }

    show(state) {
        this.app.loadView('state', {
            state: state,
        });
    }

    loadChart(state) {
        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = new CovidChart(
            this.app,
            document.getElementById('chart'),
            this.currentDate,
            this.chartDuration,
            this.chartType,
            state,
        );
    }

    loadDatatable() {
        if(this.datatable) {
            this.datatable.destroy();
        }

        this.datatable = new CovidDatatable(this.app, this.currentDate, document.getElementById('datatable'));
    }

    bindHomeEvents() {
        const stateOut = document.getElementById('stateOut');
        const newOut = document.getElementById('newOut');
        const normalizedOut = document.getElementById('normalizedOut');
        const rtOut = document.getElementById('rtOut');

        document.querySelectorAll('path').forEach(p => {
            if(!this.stateDataContainer) return;
            p.addEventListener('mouseenter', e => {
                const parent = e.target.closest('g');
                let id = e.target.getAttribute('id');
                if(parent && parent.getAttribute('id') != 'layer2') {
                    id = parent.getAttribute('id');
                }

                let stateName = 'Tiada Data';
                let data = {
                    new: 0,
                    per100k: 0,
                    rt: 0,
                }

                const stateObj = this.app.data.filter(d => d.abbr == id).pop();
                if(stateObj) {
                    stateName = stateObj.name;
                    const date = this.currentDate.toISOString();
                    if(stateObj.data[date]) {
                        data.new = stateObj.data[date].new;
                        data.per100k = Math.round(stateObj.data[date].per100k);
                        data.rt = stateObj.data[date].rt.toFixed(2);
                    }
                }

                stateOut.innerText = stateName;
                newOut.innerText = data.new;
                normalizedOut.innerText = data.per100k;
                rtOut.innerText = data.rt;

                this.stateDataContainer.classList.remove('hidden');
            });
            p.addEventListener('mousemove', e => {
                this.stateDataContainer.style.top = (e.offsetY + 20) +'px';
                this.stateDataContainer.style.left = (e.offsetX + 70) +'px';
            });
            p.addEventListener('mouseleave', e => {
                this.stateDataContainer.classList.add('hidden');
            });
        });

        document.getElementById('date').addEventListener('change', e => {
            this.currentDate = e.target.valueAsDate;
            this.renderIndex();
        });

        document.getElementById('chart-duration').addEventListener('change', e => {
            this.chartDuration = parseInt(e.target.value, 10);
            this.loadChart();
        });

        document.getElementById('chart-type').addEventListener('change', e => {
            this.chartType = e.target.value, 10;
            this.loadChart();
        });
    }

    bindGlobalEvents() {

    }
}