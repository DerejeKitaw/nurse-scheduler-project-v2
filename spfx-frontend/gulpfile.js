'use strict';

const dotenv = require('dotenv');
dotenv.config(); // ✅ only once, and after requiring

const webpack = require("webpack");
const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};

// ✅ Inject .env key into Webpack config
// build.configureWebpack.mergeConfig({
//   additionalConfiguration: (generatedConfiguration) => {
//     generatedConfiguration.plugins.push(
//       new webpack.DefinePlugin({
//         "process.env.AI_API_KEY": JSON.stringify(process.env.AI_API_KEY)
//       })
//     );
//     return generatedConfiguration;
//   }
// });

build.initialize(require('gulp'));
