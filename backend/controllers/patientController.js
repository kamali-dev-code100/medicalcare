const Patient = require("../models/Patient");

// GET /api/patients  — list with search, filter, pagination
exports.getPatients = async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status)     query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name:      { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { phone:     { $regex: search, $options: "i" } },
      ];
    }
    const total    = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate("assignedDoctor", "name department")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/patients/:id
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("assignedDoctor", "name department phone");
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/patients
exports.createPatient = async (req, res) => {
  try {
    const patient = await Patient.create({
      ...req.body,
      assignedDoctor: req.body.assignedDoctor || req.user._id,
    });
    res.status(201).json({ success: true, patient });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/patients/:id
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/patients/:id
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    res.json({ success: true, message: "Patient deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/patients/:id/vitals  — add vitals + emit socket
exports.addVitals = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    const vitals = { ...req.body, recordedBy: req.user._id, recordedAt: new Date() };
    patient.vitals.push(vitals);

    // Auto-flag critical
    const { heartRate, bpSystolic, spo2 } = req.body;
    if (heartRate > 120 || bpSystolic > 180 || spo2 < 90) {
      patient.status = "critical";
    }
    await patient.save();

    // Real-time emit
    const io = req.app.get("io");
    io.to(`patient_${patient._id}`).emit("vitals_update", {
      patientId: patient._id,
      vitals:    patient.vitals[patient.vitals.length - 1],
      status:    patient.status,
    });

    res.status(201).json({ success: true, vitals: patient.vitals });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/patients/:id/vitals
exports.getVitals = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select("vitals name patientId");
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    res.json({ success: true, vitals: patient.vitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/patients/:id/prescriptions
exports.addPrescription = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    patient.prescriptions.push({ ...req.body, prescribedBy: req.user._id });
    await patient.save();
    res.status(201).json({ success: true, prescriptions: patient.prescriptions });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/patients/stats/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [total, critical, discharged, admitted, monitoring] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: "critical" }),
      Patient.countDocuments({ status: "discharged" }),
      Patient.countDocuments({ status: "admitted" }),
      Patient.countDocuments({ status: "monitoring" }),
    ]);
    const byDepartment = await Patient.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedDoctor", "name");

    res.json({ success: true, stats: { total, critical, discharged, admitted, monitoring, byDepartment }, recentPatients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};