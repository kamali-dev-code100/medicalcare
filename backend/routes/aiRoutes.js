// routes/aiRoutes.js
const express = require("express");
const r = express.Router();
const { analyzePatient, summarizeHistory, prescriptionCheck } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");

r.use(protect);
r.post("/analyze/:patientId",    authorize("admin","doctor"), analyzePatient);
r.post("/summarize/:patientId",  authorize("admin","doctor"), summarizeHistory);
r.post("/prescription-check",    authorize("admin","doctor"), prescriptionCheck);

module.exports = r;