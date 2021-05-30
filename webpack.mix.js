const mix = require('laravel-mix');
require('./mix/hulk');
const tailwindcss = require('tailwindcss');
var path = require('path');

mix.sass('src/styles/app.scss', 'public/styles')
    .js('src/scripts/app.js', 'public/scripts')
    .hulk('src/templates/*.html')
    .options({
        postCss: [ tailwindcss('./tailwind.config.js') ],
    })
    .browserSync({
        server: { baseDir: ['public'] },
        files: [
            'src/**/*.*',
            'public/index.html',
            'public/templates/**/*.html',
        ]
    })
    .sourceMaps()
    ;