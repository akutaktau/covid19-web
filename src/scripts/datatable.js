export default class CovidDatatable {
    constructor(
        app,
        date,
        container,
    ) {
        this.app = app;
        this.date = date;
        this.container = container;
        this.build();
    }

    build() {
        if(this.datatable) {
            this.datatable.destroy();
        }
        this.container.innerHTML = '<table><thead><tr><th>Negeri</th><th>Kes Baru</th><th>Kes / 100K</th><th>Rt<sup>*</sup></th></tr></thead><tbody></tbody></table>';
        const tbody = this.container.querySelector('tbody');

        let rows = [];
        const dateStr = this.date.toISOString();
        this.app.data.forEach(d => {
            const cols = [d.name, 'Tiada Data', 0, 0];
            if(d.data[dateStr]) {
                cols[1] = d.data[dateStr].new;
                cols[2] = Math.round(d.data[dateStr].per100k);
                cols[3] = d.data[dateStr].rt.toFixed(2);
            }

            rows.push('<td>' + cols.join('</td><td>') + '</td>')
        });

        tbody.innerHTML = '<tr>' + rows.join('</tr><tr>') + '</tr>';

        this.datatable = new DataTable(this.container.querySelector('table'), {
            perPage: 16,
            perPageSelect: false,
            searchable: false,
            searchable: false,
        });

        this.datatable.columns().sort(1);
    }

    destroy() {
        this.container.innerHTML = '';
    }
}