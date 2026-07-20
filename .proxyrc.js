/**
 * Parcel dev-server proxy.
 * Forwards /api/* requests to the backend on port 5000.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

const target =
  process.env.PARCEL_PROXY_TARGET ||
  process.env.PARCEL_API_URL ||
  process.env.PARCEL_AUTH_API_URL ||
  "http://127.0.0.1:5000";

module.exports = function (app) {
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathFilter: "/api",
    })
  );
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathFilter: "/uploads",
    })
  );
};
