const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const connectDb = require("./config/db");
const env = require("./config/env");
const { authenticate } = require("./middleware/auth");
const {
  csrfProtection,
  globalLimiter,
  sanitizeRequest,
} = require("./middleware/security");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(globalLimiter);
app.use(sanitizeRequest);
app.use(csrfProtection);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "myjourney-auth" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Auth API running on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Could not start server", error);
    process.exit(1);
  });
