const gulp = require('gulp');
const plugins = require('gulp-load-plugins');
const yargs = require('yargs');
const panini = require('panini');
const rimraf = require('rimraf');
const browser = require('browser-sync');

const $ = plugins();
const isProduction = !!(yargs.argv.production);

gulp.task('build', gulp.series(clean, gulp.parallel(pages, sass, javascript, images, copy)));
gulp.task('default', gulp.series('build', server, watch));

function clean(done) {
    rimraf('public', done);
}

function copy() {
    return gulp.src('assets').pipe(gulp.dest('public/assets'));
}

function pages() {
    const config = { root: 'pages/', layouts: 'layouts/', partials: 'partials/' };
    return gulp.src('pages/**/*.html').pipe(panini(config)).pipe(gulp.dest('public'));
}

function resetPages(done) {
    panini.refresh();
    done();
}

function sass() {
    return gulp.src('scss/app.scss')
        .pipe($.sourcemaps.init())
        .pipe($.sass())
        .pipe($.autoprefixer('last 2 versions'))
        .pipe($.if(isProduction, $.cleanCss({ compatiblity: 'ie9' })))
        .pipe($.if(!isProduction, $.sourcemaps.write()))
        .pipe(gulp.dest('public/css'))
        .pipe(browser.stream());
}

function javascript() {
    return gulp.src('scripts/app.js').pipe($.sourcemaps.init())
        .pipe($.if(isProduction, $.uglify()))
        .pipe($.if(!isProduction, $.sourcemaps.write()))
        .pipe(gulp.dest('public/scripts'));
}

function images() {
    return gulp.src('assets/img/**/*')
        .pipe($.if(isProduction, $.imagemin({ progressive: true })))
        .pipe(gulp.dest('public/assets/img'));
}

function server(done) {
    browser.init({ server: 'public', port: '8000'});
    done();
}

function reload(done) {
    browser.reload();
    done();
}

function watch() {
    gulp.watch('assets', copy);
    gulp.watch('pages/**/*.html').on('change', gulp.series(pages, reload));
    gulp.watch('layouts/**/*.html').on('all', gulp.series(resetPages, pages, reload));
    gulp.watch('partials/**/*.html').on('all', gulp.series(resetPages, pages, reload));
    gulp.watch('scss/**/*.scss').on('all', sass);
    gulp.watch('scripts/**/*.js').on('all', gulp.series(javascript, reload));
    gulp.watch('assets/img/**/*').on('all', gulp.series(images, reload));
}