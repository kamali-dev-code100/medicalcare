const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ── Allowed Origins ──────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "https://medai-care.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS: " + origin))
    }
  },
  credentials: true,
}

// ── Socket.io setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  socket.on("join_patient", (patientId) => {
    socket.join(`patient_${patientId}`);
  });
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Rate limiting
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { success: false, message: "Too many requests. Try again later." },
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/authRoutes"));
app.use("/api/patients",     require("./routes/patientRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/ai",           require("./routes/aiRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "MedAI API running 🏥", uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❗", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Connect DB and Start ─────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server: http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });