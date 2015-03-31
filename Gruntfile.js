/* jshint node:true */
"use strict";

var webpack = require('webpack');

module.exports = function(grunt) {
  // Load tasks & measure timing
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  // Configure Grunt tasks
  grunt.initConfig({
    /**
     * Clean the `dist/` folder between builds.
     */
    clean: {
      'dist': ['dist/']
    },

    /**
     * Bump version numbers in `package.json` and `bower.json`,
     * and make a version commit marker. Used by CI script.
     */
    bump: {
      options: {
        files: ["package.json", "bower.json"],
        commitFiles: ["package.json", "bower.json"],
        push: false,
        createTag: false
      }
    },

    /**
     * Pre-process CSS with LibSass.
     */
    sass: {
      // On production builds, minify and remove comments.
      prod: {
        files: {
          'dist/modal.css': 'src/modal.scss'
        },
        options: {
          outputStyle: 'compressed'
        }
      },

      // On development builds, include source maps & do not minify.
      debug: {
        files: {
          'dist/modal.css': 'src/modal.scss'
        },
        options: {
          sourceMap: true
        }
      }
    },

    /**
     * Post-process CSS with PostCSS.
     *
     * We use Autoprefixer to automatically add vendor-prefixes for appropriate
     * browsers. We use CSS-MQPacker to concatenate all media queries at the
     * end of our built stylesheets.
     */
    postcss: {
      options: {
        processors: [
          require('autoprefixer-core')({
            browsers: ['last 4 versions', 'Firefox ESR', 'Opera 12.1']
          }).postcss,
          require('css-mqpacker').postcss
        ]
      },

      // On production builds, omit source maps.
      prod: {
        src: ['dist/modal.css'],
        options: {
          map: false
        }
      },

      // On development builds, include source maps.
      debug: {
        src: ['dist/modal.css']
      }
    },

    /**
     * Build JavaScript with Webpack.
     */
    webpack: {
      options: {
        entry: './src/modal.js',
        output: {
          filename: 'dist/modal.js',
          library: 'DSModal',
          libraryTarget: 'umd'
        },
        externals: {
          // Don't bundle the 'jquery' package in neue.js, but
          // instead load from `jQuery` global variable or AMD/CJS package.
          'jquery': {
            root: 'jQuery',
            commonjs2: 'jquery',
            amd: 'jquery'
          }
        },
        module: {
          loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
          ]
        }
      },

      // On production builds, disable source maps & set production flags
      prod: {
        plugins: [
          new webpack.DefinePlugin({
            DEBUG: false,
            PRODUCTION: true
          })
        ]
      },

      // On development builds, include source maps & set debug flags
      debug: {
        devtool: '#inline-source-map',
        plugins: [
          new webpack.DefinePlugin({
            DEBUG: true,
            PRODUCTION: false
          })
        ]
      }
    },

    /**
     * Uglify JavaScript with UglifyJS2.
     */
    uglify: {
      // On production builds, we should minify and drop
      // dead code, `debugger`, and `console.log` statements.
      prod: {
        files: { 'dist/modal.js': ['dist/modal.js'] },
        options: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            dead_code: true
          }
        }

      }
    },

    /**
     * Create custom Modernizr build based on referenced CSS
     * classes and JavaScript Modernizr checks.
     */
    modernizr: {
      all: {
        "devFile": "remote",
        "outputFile": "dist/modernizr.js",
        "files" : {
          "src": [
            "src/**/*.js",
            "src/**/*.scss"
          ]
        },
        extensibility : {
          // We prefix all Modernizr classes with `modernizr-` to avoid class conflicts.
          "cssclassprefix": "modernizr-"
        },
        "extra" : {
          "shiv" : false,
          "teststyles": true,
          "printshiv" : false,
          "load" : true,
          "mq" : false,
          "video": false
        }
      }
    },

    /**
     * Lint JavaScript using JSHint.
     */
    jshint: {
      options: {
        force: true,
        jshintrc: true,
        reporter: require("jshint-stylish")
      },
      all: [
        "src/**/*.js",
        "tests/**/*.js",
        "!tests/lib/**/*.js"
      ]
    },

    /**
     * Run unit tests with QUnit.
     */
    qunit: {
      all: ["tests/**/*.html"]
    },

    /**
     * Watch files for changes, and trigger relevant tasks.
     */
    watch: {
      sass: {
        files: ["src/**/*.scss"],
        tasks: ["sass:debug", "postcss:debug"]
      },
      js: {
        files: ["src/**/*.js"],
        tasks: ["webpack:debug", "jshint", "qunit"]
      }
    }
  });

  /**
   * Register Grunt aliases.
   */

  // > grunt
  // Build for development & watch for changes.
  grunt.registerTask('default', ['build:debug', 'test', 'watch']);

  // > grunt build
  // Build for production.
  grunt.registerTask('build', ['clean:dist', 'sass:prod', 'postcss:prod', 'webpack:prod', 'uglify:prod', 'modernizr:all']);

  // > grunt build:debug
  // Build for development.
  grunt.registerTask('build:debug', ['clean:dist', 'sass:debug', 'postcss:debug', 'webpack:debug', 'modernizr:all']);

  // > grunt test
  // Run included unit tests and linters.
  grunt.registerTask('test', ['jshint', 'qunit']);

};

