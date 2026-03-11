const Appointment = require("../models/Appointment");

// GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    const { date, doctor, status, patient } = req.query;
    const query = {};
    if (status)  query.status  = status;
    if (doctor)  query.doctor  = doctor;
    if (patient) query.patient = patient;
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end   = new Date(date); end.setHours(23,59,59,999);
      query.date  = { $gte: start, $lte: end };
    }
    const appointments = await Appointment.find(query)
      .populate("patient", "name patientId phone")
      .populate("doctor",  "name department")
      .sort({ date: 1 });
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/appointments
 exports.createAppointment = async (req, res) => {
  try {
    const appt = await Appointment.create(req.body)
    await appt.populate("patient", "name")
    await appt.populate("doctor", "name")
    res.status(201).json({ success: true, appointment: appt })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/appointments/:id
exports.updateAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appt) return res.status(404).json({ success: false, message: "Not found." });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/appointments/:id
exports.deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Appointment cancelled." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};