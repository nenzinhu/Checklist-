/**
 * Servidor estático local (ES modules precisam de HTTP).
 * Uso: node serve.js
 * Abra: http://127.0.0.1:8765/
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8765;
const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (url === "/") url = "/index.html";
    const file = path.normalize(path.join(root, url.replace(/^\//, "")));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`Checklist em http://127.0.0.1:${PORT}/`);
  });
