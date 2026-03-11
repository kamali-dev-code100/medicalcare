// routes/appointmentRoutes.js
const express = require("express");
const r = express.Router();
const { getAppointments, createAppointment, updateAppointment, deleteAppointment } = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/auth");

r.use(protect);
r.route("/").get(getAppointments).post(authorize("admin","doctor","receptionist"), createAppointment);
r.route("/:id").put(authorize("admin","doctor","receptionist"), updateAppointment).delete(authorize("admin"), deleteAppointment);

module.exports = r;