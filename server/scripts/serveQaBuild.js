const express = require("express");
const http = require("http");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = Number(process.env.PREVIEW_PORT || 1235);
const target = process.env.PREVIEW_API_TARGET || "http://127.0.0.1:5001";
const dist = path.join(__dirname, "../../dist");
const app = express();
const proxy = createProxyMiddleware({
  target,
  changeOrigin: true,
  ws: true,
  pathFilter: ["/api", "/socket.io"],
});

app.use(proxy);
app.use(express.static(dist));
app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));

const server = http.createServer(app);
server.on("upgrade", proxy.upgrade);
if (proxy.upgrade) {
  server.on("upgrade", (req, socket, head) => {
    socket.on("error", (err) => {
      // ignore socket errors on reset
    });
    try {
      proxy.upgrade(req, socket, head);
    } catch (err) {
      // ignore
    }
  });
}
server.on("error", (err) => {
  console.error("Preview server error:", err.message);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception in preview server:", err.message);
});

server.listen(port, () => {
  console.log(`MyJourney QA preview: http://localhost:${port}`);
  console.log(`Proxying API and realtime traffic to ${target}`);
});
