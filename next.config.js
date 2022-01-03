const withTM = require("next-transpile-modules");
const withImages = require("next-images");
const withPWA = require("next-pwa");
const runtimeCaching = require("./cache");
const { withSentryConfig } = require('@sentry/nextjs');

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

let transpileModules = [
  "tuteria-frontend-components",
  "@tuteria/shared-lib",
  "@gbozee/tuteria-design-system",
  "@tuteria/tuteria-data",
];


// module.exports = withPWA(
module.exports = withSentryConfig(withImages(
  withTM({
    // pwa: {
    //   dest: "public",
    //   runtimeCaching,
    // },
    transpileModules,
    loaderFunc: (library) => {
      library.options.plugins = [
        require("@babel/plugin-transform-flow-strip-types"),
        // require("emotion")
      ];
      return library;
    },
    webpack(config, options) {
      config.module.rules.push({
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      });

      return config;
    },
    webpackDevMiddleware(config, options) {
      config.watchOptions.ignored = config.watchOptions.ignored.filter(
        (ignore) => !ignore.toString().includes("node_modules")
      );
      // Ignore all node modules except those here.
      config.watchOptions.ignored = [
        ...config.watchOptions.ignored,
        /node_modules\/(?!@tuteria\/.+)/,
        /\@tuteria\/.+\/node_modules/,
        // /node_modules([\\]+|\/)+(?!@tuteria[\\/]shared-lib)/,
        // /node_modules([\\]+|\/)+(?!@tuteria[\\/]tuteria-data)/,
        // /\@tuteria[\\/]shared-lib([\\]+|\/)node_modules/,
        // /\@tuteria[\\/]tuteria-data([\\]+|\/)node_modules/,
      ];
      return config;
    },
    assetPrefix: process.env.BASE_PATH || "",
    publicRuntimeConfig: {
      basePath: process.env.BASE_PATH || "",
    },
    reactStrictMode: true,
  })
),sentryWebpackPluginOptions);
// );
