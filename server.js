// This file doesn't go through babel or webpack transformation.
// Make sure the syntax and sources this file requires are compatible with the current node version you are running
// See https://github.com/zeit/next.js/issues/1245 for discussions on Universal Webpack or universal Babel
const { createServer } = require("http");
const https = require('https');
const http = require('http');
const fs = require('fs')
const { parse } = require("url");
const next = require("next");
const path = require("path")

var options = {
    key: fs.readFileSync(path.join(__dirname,"keys",'localhost.key')),
    cert: fs.readFileSync(path.join(__dirname,"keys",'localhost.crt')),
    ca: [fs.readFileSync(path.join(__dirname,"keys",'localhost.crt'))]
};

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 8080;
const provider = process.env.NEXT_PROVIDER || "http"
app.prepare().then(() => {
  if(provider === "http"){
    createServer((req, res) => {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);

      handle(req, res, parsedUrl);
    }).listen(PORT, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  }else{
    https.createServer(options,(req, res) => {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);

      handle(req, res, parsedUrl);
    }).listen(PORT, err => {
      if (err) throw err;
      console.log(`> Ready on https://localhost:${PORT}`);
    });
  }
});
