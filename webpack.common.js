const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: path.join(__dirname, "src/popup/index.tsx"),
    background: path.join(__dirname, "src/background/index.ts"),
    inpage: path.join(__dirname, "src/inpage/index.ts")
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        exclude: /node_modules/,
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader" // Creates style nodes from JS strings
          },
          {
            loader: "css-loader" // Translates CSS into CommonJS
          },
          {
            loader: "sass-loader" // Compiles Sass to CSS
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'resolve-url-loader'],
        include: [
          path.join(__dirname, 'src'),
          /node_modules/
        ]
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: "url-loader",
        options: {
            limit: 10000,
            name: "static/[name].[hash:8].[ext]",
        },
      },
      {
          test: [/\.eot$/, /\.ttf$/, /\.svg$/, /\.woff$/, /\.woff2$/],
          loader: "file-loader",
          options: {
              name: "static/[name].[hash:8].[ext]",
          },
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  plugins: [
    new CopyWebpackPlugin(["resources", {
      from: "src/background/index.html",
      to: "background.html"
    }, {
      from: "src/popup/index.html",
      to: "popup.html"
    }, {
      from: "src/options/index.html",
      to: "options.html"
    }]),
  ]
};
