"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler
});
module.exports = __toCommonJS(index_exports);

// src/app.ts
var import_dotenv3 = require("dotenv");
var import_express15 = __toESM(require("express"), 1);

// src/routes/admin.routes.ts
var import_express = require("express");

// src/controllers/admin.controller.ts
var import_mongoose2 = __toESM(require("mongoose"), 1);

// src/models/Admin.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var adminSchema = new import_mongoose.default.Schema(
  {
    adminName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false }
  },
  { timestamps: true }
);
var Admin_default = import_mongoose.default.models.Admin || import_mongoose.default.model("Admin", adminSchema);

// src/utils/password.ts
var import_bcryptjs = require("bcryptjs");
var BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
var getSaltRounds = () => {
  const parsed = Number(process.env.PASSWORD_SALT_ROUNDS ?? 10);
  if (!Number.isInteger(parsed) || parsed < 4 || parsed > 15) {
    return 10;
  }
  return parsed;
};
var hashPassword = async (plainPassword) => {
  return (0, import_bcryptjs.hash)(plainPassword, getSaltRounds());
};
var isHashedPassword = (passwordHash) => {
  return BCRYPT_HASH_PATTERN.test(passwordHash);
};
var verifyPassword = async (plainPassword, passwordHash) => {
  if (isHashedPassword(passwordHash)) {
    return (0, import_bcryptjs.compare)(plainPassword, passwordHash);
  }
  return passwordHash === plainPassword;
};

// src/validators/admin.validator.ts
var import_zod = __toESM(require("zod"), 1);
var createAdminBodySchema = import_zod.default.object({
  adminName: import_zod.default.string().min(1),
  email: import_zod.default.email(),
  phone: import_zod.default.string().min(1),
  password: import_zod.default.string().min(6)
});
var updateAdminBodySchema = createAdminBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/admin.controller.ts
var getIdParam = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose2.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var createAdmin = async (req, res, next) => {
  const parsedBody = createAdminBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid admin payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { adminName, email, phone, password } = parsedBody.data;
  try {
    const passwordHash = await hashPassword(password);
    const existingAdmin = await Admin_default.findOne({ email }).select("_id");
    if (existingAdmin) {
      res.status(409).json({ message: "Admin with this email already exists" });
      return;
    }
    const admin = await Admin_default.create({
      adminName,
      email,
      phone,
      passwordHash
    });
    res.status(201).json({ message: "Admin created", admin });
  } catch (error) {
    next(error);
  }
};
var getAllAdmins = async (_req, res, next) => {
  try {
    const admins = await Admin_default.find();
    res.status(200).json({ admins });
  } catch (error) {
    next(error);
  }
};
var getAdminById = async (req, res, next) => {
  const id = getIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid admin id" });
    return;
  }
  try {
    const admin = await Admin_default.findById(id);
    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }
    res.status(200).json({ admin });
  } catch (error) {
    next(error);
  }
};
var updateAdminById = async (req, res, next) => {
  const id = getIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid admin id" });
    return;
  }
  const parsedBody = updateAdminBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid admin update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { password, ...rest } = parsedBody.data;
  const hashedPassword = password ? await hashPassword(password) : null;
  const updatePayload = {
    ...rest,
    ...hashedPassword ? { passwordHash: hashedPassword } : {}
  };
  try {
    const updatedAdmin = await Admin_default.findByIdAndUpdate(id, updatePayload, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedAdmin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }
    res.status(200).json({ message: "Admin updated", admin: updatedAdmin });
  } catch (error) {
    next(error);
  }
};
var deleteAdminById = async (req, res, next) => {
  const id = getIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid admin id" });
    return;
  }
  try {
    const deletedAdmin = await Admin_default.findByIdAndDelete(id);
    if (!deletedAdmin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }
    res.status(200).json({ message: "Admin deleted" });
  } catch (error) {
    next(error);
  }
};

// src/models/Doctor.ts
var import_mongoose3 = __toESM(require("mongoose"), 1);
var doctorSchema = new import_mongoose3.default.Schema(
  {
    doctorName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    description: { type: String, default: "" },
    specialities: { type: [String], default: [] }
  },
  { timestamps: true }
);
var Doctor_default = import_mongoose3.default.models.Doctor || import_mongoose3.default.model("Doctor", doctorSchema);

// src/models/Trainer.ts
var import_mongoose4 = __toESM(require("mongoose"), 1);
var trainerSchema = new import_mongoose4.default.Schema(
  {
    trainerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    description: { type: String, default: "" },
    specialities: { type: [String], default: [] }
  },
  { timestamps: true }
);
var Trainer_default = import_mongoose4.default.models.Trainer || import_mongoose4.default.model("Trainer", trainerSchema);

// src/models/User.ts
var import_mongoose5 = __toESM(require("mongoose"), 1);

// src/models/Enums.ts
var Gender = /* @__PURE__ */ ((Gender2) => {
  Gender2[Gender2["Male"] = 0] = "Male";
  Gender2[Gender2["Female"] = 1] = "Female";
  Gender2[Gender2["Others"] = 2] = "Others";
  return Gender2;
})(Gender || {});
var BookingStatus = /* @__PURE__ */ ((BookingStatus2) => {
  BookingStatus2[BookingStatus2["Booked"] = 0] = "Booked";
  BookingStatus2[BookingStatus2["Confirmed"] = 1] = "Confirmed";
  BookingStatus2[BookingStatus2["Cancelled"] = 2] = "Cancelled";
  BookingStatus2[BookingStatus2["Attended"] = 3] = "Attended";
  BookingStatus2[BookingStatus2["Unattended"] = 4] = "Unattended";
  return BookingStatus2;
})(BookingStatus || {});
var MembershipStatus = /* @__PURE__ */ ((MembershipStatus2) => {
  MembershipStatus2["Active"] = "Active";
  MembershipStatus2["Paused"] = "Paused";
  MembershipStatus2["Cancelled"] = "Cancelled";
  MembershipStatus2["Expired"] = "Expired";
  return MembershipStatus2;
})(MembershipStatus || {});
var TodoStatus = /* @__PURE__ */ ((TodoStatus2) => {
  TodoStatus2[TodoStatus2["Todo"] = 0] = "Todo";
  TodoStatus2[TodoStatus2["Doing"] = 1] = "Doing";
  TodoStatus2[TodoStatus2["Done"] = 2] = "Done";
  return TodoStatus2;
})(TodoStatus || {});
var LeadStatus = /* @__PURE__ */ ((LeadStatus2) => {
  LeadStatus2["New"] = "New";
  LeadStatus2["Contacted"] = "Contacted";
  LeadStatus2["Qualified"] = "Qualified";
  LeadStatus2["Warm"] = "Warm";
  LeadStatus2["Hot"] = "Hot";
  LeadStatus2["Cold"] = "Cold";
  LeadStatus2["Converted"] = "Converted";
  LeadStatus2["Lost"] = "Lost";
  return LeadStatus2;
})(LeadStatus || {});

// src/models/User.ts
var userSchema = new import_mongoose5.default.Schema(
  {
    username: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    healthGoals: { type: [String], default: [] },
    passwordHash: { type: String, required: true, select: false },
    onboarded: { type: Boolean, default: false }
  },
  { timestamps: true }
);
var User_default = import_mongoose5.default.models.User || import_mongoose5.default.model("User", userSchema);

// src/middleware/basic-auth.middleware.ts
var getCredentialsFromHeader = (authorization) => {
  if (!authorization) {
    return null;
  }
  const [scheme, encodedCredentials] = authorization.split(" ");
  if (scheme !== "Basic" || !encodedCredentials) {
    return null;
  }
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
    "utf8"
  );
  const separatorIndex = decodedCredentials.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }
  const email = decodedCredentials.slice(0, separatorIndex).trim();
  const password = decodedCredentials.slice(separatorIndex + 1);
  if (!email || !password) {
    return null;
  }
  return { email, password };
};
var authenticateBasicCredentials = async (req, res, next) => {
  const credentials = getCredentialsFromHeader(req.header("authorization"));
  if (!credentials) {
    res.status(401).json({ message: "Missing or invalid Authorization header" });
    return;
  }
  const { email, password } = credentials;
  try {
    const [admin, doctor, trainer, user] = await Promise.all([
      Admin_default.findOne({ email }).select("_id email +passwordHash"),
      Doctor_default.findOne({ email }).select("_id email +passwordHash"),
      Trainer_default.findOne({ email }).select("_id email +passwordHash"),
      User_default.findOne({ email }).select("_id email +passwordHash")
    ]);
    const candidates = [
      { role: "admin", account: admin },
      { role: "doctor", account: doctor },
      { role: "trainer", account: trainer },
      { role: "user", account: user }
    ];
    for (const candidate of candidates) {
      if (!candidate.account) {
        continue;
      }
      const valid = await verifyPassword(password, candidate.account.passwordHash);
      if (!valid) {
        continue;
      }
      if (!isHashedPassword(candidate.account.passwordHash)) {
        candidate.account.passwordHash = await hashPassword(password);
        await candidate.account.save();
      }
      req.user = {
        id: candidate.account._id.toString(),
        email: candidate.account.email,
        role: candidate.role
      };
      next();
      return;
    }
    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    next(error);
  }
};

// src/middleware/rbac.middleware.ts
var authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
};

// src/routes/admin.routes.ts
var adminRouter = (0, import_express.Router)();
adminRouter.use(authenticateBasicCredentials);
adminRouter.post("/", authorize(["admin"]), createAdmin);
adminRouter.get("/", authorize(["admin"]), getAllAdmins);
adminRouter.get("/:id", authorize(["admin"]), getAdminById);
adminRouter.patch("/:id", authorize(["admin"]), updateAdminById);
adminRouter.delete("/:id", authorize(["admin"]), deleteAdminById);
var admin_routes_default = adminRouter;

// src/routes/appointment.routes.ts
var import_express2 = require("express");

// src/controllers/appointment.controller.ts
var import_mongoose7 = __toESM(require("mongoose"), 1);

// src/models/Appointment.ts
var import_mongoose6 = __toESM(require("mongoose"), 1);
var appointmentSchema = new import_mongoose6.default.Schema(
  {
    appointmentDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      required: true,
      default: 0 /* Booked */
    },
    user: { type: import_mongoose6.default.Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: import_mongoose6.default.Schema.Types.ObjectId, ref: "Slot", required: true },
    doctor: {
      type: import_mongoose6.default.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    report: {
      type: import_mongoose6.default.Schema.Types.ObjectId,
      ref: "Report",
      default: ""
    }
  },
  { timestamps: true }
);
var Appointment_default = import_mongoose6.default.models.Appointment || import_mongoose6.default.model("Appointment", appointmentSchema);

// src/validators/appointment.validator.ts
var import_zod2 = __toESM(require("zod"), 1);
var createAppointmentBodySchema = import_zod2.default.object({
  appointmentDate: import_zod2.default.coerce.date(),
  userId: import_zod2.default.string().min(1),
  slotId: import_zod2.default.string().min(1),
  doctorId: import_zod2.default.string().min(1),
  reportId: import_zod2.default.string().min(1).optional()
});
var updateAppointmentBodySchema = import_zod2.default.object({
  appointmentDate: import_zod2.default.coerce.date().optional(),
  slotId: import_zod2.default.string().min(1).optional(),
  doctorId: import_zod2.default.string().min(1).optional(),
  reportId: import_zod2.default.string().min(1).optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});
var changeAppointmentStatusBodySchema = import_zod2.default.object({
  status: import_zod2.default.coerce.number().refine((value) => value in BookingStatus, {
    message: "Invalid appointment status"
  })
});

// src/controllers/appointment.controller.ts
var getIdParam2 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose7.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var getRequiredAuthenticatedUser = (req) => {
  if (!req.user) {
    return null;
  }
  return req.user;
};
var getDoctorIdForRequester = async (requesterId) => {
  const doctor = await Doctor_default.findOne({ _id: requesterId }).select("_id");
  if (!doctor) {
    return null;
  }
  return doctor._id.toString();
};
var createAppointment = async (req, res, next) => {
  const parsedBody = createAppointmentBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid appointment payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { appointmentDate, userId, slotId, doctorId, reportId } = parsedBody.data;
  if (!import_mongoose7.default.Types.ObjectId.isValid(userId) || !import_mongoose7.default.Types.ObjectId.isValid(slotId) || !import_mongoose7.default.Types.ObjectId.isValid(doctorId) || reportId && !import_mongoose7.default.Types.ObjectId.isValid(reportId)) {
    res.status(400).json({ message: "Invalid appointment references" });
    return;
  }
  try {
    const appointment = await Appointment_default.create({
      appointmentDate,
      user: userId,
      slot: slotId,
      doctor: doctorId,
      ...reportId ? { report: reportId } : {}
    });
    res.status(201).json({ message: "Appointment created", appointment });
  } catch (error) {
    next(error);
  }
};
var getAllAppointments = async (_req, res, next) => {
  try {
    const appointments = await Appointment_default.find();
    res.status(200).json({ appointments });
  } catch (error) {
    next(error);
  }
};
var getAppointmentById = async (req, res, next) => {
  const id = getIdParam2(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid appointment id" });
    return;
  }
  try {
    const appointment = await Appointment_default.findById(id);
    if (!appointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    res.status(200).json({ appointment });
  } catch (error) {
    next(error);
  }
};
var getMyAppointments = async (req, res, next) => {
  const requester = getRequiredAuthenticatedUser(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role !== "doctor") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  try {
    const appointments = await Appointment_default.find({ doctor: requester.id });
    res.status(200).json({ appointments });
  } catch (error) {
    next(error);
  }
};
var updateAppointmentById = async (req, res, next) => {
  const id = getIdParam2(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid appointment id" });
    return;
  }
  const parsedBody = updateAppointmentBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid appointment update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { appointmentDate, slotId, doctorId, reportId } = parsedBody.data;
  if (slotId && !import_mongoose7.default.Types.ObjectId.isValid(slotId) || doctorId && !import_mongoose7.default.Types.ObjectId.isValid(doctorId) || reportId && !import_mongoose7.default.Types.ObjectId.isValid(reportId)) {
    res.status(400).json({ message: "Invalid appointment references" });
    return;
  }
  try {
    const updatedAppointment = await Appointment_default.findByIdAndUpdate(
      id,
      {
        ...appointmentDate ? { appointmentDate } : {},
        ...slotId ? { slot: slotId } : {},
        ...doctorId ? { doctor: doctorId } : {},
        ...reportId ? { report: reportId } : {}
      },
      { returnDocument: "after", runValidators: true }
    );
    if (!updatedAppointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    res.status(200).json({
      message: "Appointment updated",
      appointment: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};
var deleteAppointmentById = async (req, res, next) => {
  const id = getIdParam2(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid appointment id" });
    return;
  }
  try {
    const deletedAppointment = await Appointment_default.findByIdAndDelete(id);
    if (!deletedAppointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    next(error);
  }
};
var changeAppointmentStatus = async (req, res, next) => {
  const id = getIdParam2(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid appointment id" });
    return;
  }
  const parsedBody = changeAppointmentStatusBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid appointment status payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const requester = getRequiredAuthenticatedUser(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const appointment = await Appointment_default.findById(id);
    if (!appointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    if (requester.role === "doctor") {
      const requesterDoctorId = await getDoctorIdForRequester(requester.id);
      if (!requesterDoctorId || appointment.doctor.toString() !== requesterDoctorId) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
    }
    appointment.status = parsedBody.data.status;
    await appointment.save();
    res.status(200).json({ message: "Appointment status changed", appointment });
  } catch (error) {
    next(error);
  }
};

// src/routes/appointment.routes.ts
var appointmentRouter = (0, import_express2.Router)();
appointmentRouter.use(authenticateBasicCredentials);
appointmentRouter.post("/", authorize(["admin"]), createAppointment);
appointmentRouter.get("/", authorize(["admin"]), getAllAppointments);
appointmentRouter.get("/me", authorize(["doctor"]), getMyAppointments);
appointmentRouter.get("/:id", authorize(["admin"]), getAppointmentById);
appointmentRouter.patch("/:id", authorize(["admin"]), updateAppointmentById);
appointmentRouter.delete("/:id", authorize(["admin"]), deleteAppointmentById);
appointmentRouter.patch(
  "/:id/status",
  authorize(["admin", "doctor"]),
  changeAppointmentStatus
);
var appointment_routes_default = appointmentRouter;

// src/routes/auth.routes.ts
var import_express3 = require("express");

// src/validators/auth.validator.ts
var import_zod3 = __toESM(require("zod"), 1);
var genderValues = Object.values(Gender).map(String);
var signupAgeSchema = import_zod3.default.preprocess((value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
}, import_zod3.default.string().min(1));
var signupGenderSchema = import_zod3.default.preprocess((value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.toLowerCase() === "other") {
      return "Others";
    }
    return normalized;
  }
  return value;
}, import_zod3.default.enum(genderValues));
var signupBodySchema = import_zod3.default.object({
  username: import_zod3.default.string().trim().min(1),
  phone: import_zod3.default.string().trim().min(1),
  email: import_zod3.default.string().email(),
  age: signupAgeSchema,
  gender: signupGenderSchema,
  healthGoals: import_zod3.default.array(import_zod3.default.string().trim().min(1)).default([]),
  password: import_zod3.default.string().min(6)
});
var loginBodySchema = import_zod3.default.object({
  email: import_zod3.default.string().email(),
  password: import_zod3.default.string().min(1)
});

// src/controllers/auth.controller.ts
var matchAccount = async (password, role, account) => {
  if (!account) {
    return null;
  }
  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    return null;
  }
  if (!isHashedPassword(account.passwordHash)) {
    account.passwordHash = await hashPassword(password);
    await account.save();
  }
  return {
    id: account._id.toString(),
    email: account.email,
    role
  };
};
var signup = async (req, res, next) => {
  const parsedBody = signupBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid signup data",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { username, phone, email, age, gender, healthGoals, password } = parsedBody.data;
  try {
    const passwordHash = await hashPassword(password);
    const existingUser = await User_default.findOne({ email }).select("_id");
    if (existingUser) {
      res.status(409).json({ message: "User with this email already exists" });
      return;
    }
    const createdUser = await User_default.create({
      username,
      phone,
      email,
      age,
      gender,
      healthGoals,
      onboarded: false,
      passwordHash
    });
    res.status(201).json({
      message: "User signup successful",
      userId: createdUser._id,
      onboarded: createdUser.onboarded
    });
  } catch (error) {
    next(error);
  }
};
var login = async (req, res, next) => {
  console.log("[AUTH][LOGIN] Request received", {
    path: req.originalUrl,
    method: req.method,
    hasBody: Boolean(req.body)
  });
  const parsedBody = loginBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    console.log("[AUTH][LOGIN] Validation failed", {
      errors: parsedBody.error.issues
    });
    res.status(400).json({
      message: "Invalid login data",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { email, password } = parsedBody.data;
  try {
    console.log("[AUTH][LOGIN] Looking up user/admin/doctor/trainer", { email });
    const [user, admin, doctor, trainer] = await Promise.all([
      User_default.findOne({ email }).select("+passwordHash"),
      Admin_default.findOne({ email }).select("+passwordHash"),
      Doctor_default.findOne({ email }).select("+passwordHash"),
      Trainer_default.findOne({ email }).select("+passwordHash")
    ]);
    const matchedAccount = await matchAccount(password, "user", user) ?? await matchAccount(password, "admin", admin) ?? await matchAccount(password, "doctor", doctor) ?? await matchAccount(password, "trainer", trainer);
    if (!matchedAccount) {
      console.log("[AUTH][LOGIN] Invalid credentials", {
        email,
        userFound: Boolean(user),
        adminFound: Boolean(admin)
      });
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    req.user = matchedAccount;
    console.log("[AUTH][LOGIN] Login successful", {
      email,
      userId: req.user.id,
      role: req.user.role
    });
    res.status(200).json({
      message: "Login successful",
      user: req.user
    });
  } catch (error) {
    console.error("[AUTH][LOGIN] Unexpected error", error);
    next(error);
  }
};

// src/routes/auth.routes.ts
var authRouter = (0, import_express3.Router)();
authRouter.post("/signup", signup);
authRouter.post("/login", login);
var auth_routes_default = authRouter;

// src/routes/booking.routes.ts
var import_express4 = require("express");

// src/controllers/booking.controller.ts
var import_mongoose9 = __toESM(require("mongoose"), 1);

// src/models/Bookings.ts
var import_mongoose8 = __toESM(require("mongoose"), 1);
var bookingSchema = new import_mongoose8.default.Schema(
  {
    bookingDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: 0 /* Booked */,
      required: true
    },
    user: { type: import_mongoose8.default.Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: import_mongoose8.default.Schema.Types.ObjectId, ref: "Slot", required: true },
    service: {
      type: import_mongoose8.default.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },
    report: {
      type: import_mongoose8.default.Schema.Types.ObjectId,
      ref: "Report",
      default: ""
    }
  },
  { timestamps: true }
);
var Bookings_default = import_mongoose8.default.models.Booking || import_mongoose8.default.model("Booking", bookingSchema);

// src/validators/booking.validator.ts
var import_zod4 = __toESM(require("zod"), 1);
var createBookingBodySchema = import_zod4.default.object({
  bookingDate: import_zod4.default.coerce.date(),
  userId: import_zod4.default.string().min(1).optional(),
  slotId: import_zod4.default.string().min(1),
  serviceId: import_zod4.default.string().min(1),
  reportId: import_zod4.default.string().min(1).optional()
});
var updateBookingBodySchema = import_zod4.default.object({
  bookingDate: import_zod4.default.coerce.date().optional(),
  slotId: import_zod4.default.string().min(1).optional(),
  serviceId: import_zod4.default.string().min(1).optional(),
  reportId: import_zod4.default.string().min(1).optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});
var changeBookingStatusBodySchema = import_zod4.default.object({
  status: import_zod4.default.coerce.number().refine((value) => value in BookingStatus, {
    message: "Invalid booking status"
  })
});

// src/controllers/booking.controller.ts
var getIdParam3 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose9.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var getRequiredAuthenticatedUser2 = (req) => {
  if (!req.user) {
    return null;
  }
  return req.user;
};
var createBooking = async (req, res, next) => {
  const parsedBody = createBookingBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid booking payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const requester = getRequiredAuthenticatedUser2(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const { bookingDate, userId, slotId, serviceId, reportId } = parsedBody.data;
  const targetUserId = requester.role === "user" ? requester.id : userId;
  if (!targetUserId) {
    res.status(400).json({ message: "userId is required for admin bookings" });
    return;
  }
  if (!import_mongoose9.default.Types.ObjectId.isValid(targetUserId) || !import_mongoose9.default.Types.ObjectId.isValid(slotId) || !import_mongoose9.default.Types.ObjectId.isValid(serviceId) || reportId && !import_mongoose9.default.Types.ObjectId.isValid(reportId)) {
    res.status(400).json({ message: "Invalid booking references" });
    return;
  }
  try {
    const booking = await Bookings_default.create({
      bookingDate,
      user: targetUserId,
      slot: slotId,
      service: serviceId,
      ...reportId ? { report: reportId } : {}
    });
    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    next(error);
  }
};
var getAllBookings = async (_req, res, next) => {
  try {
    const bookings = await Bookings_default.find();
    res.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
};
var getBookingById = async (req, res, next) => {
  const id = getIdParam3(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid booking id" });
    return;
  }
  try {
    const booking = await Bookings_default.findById(id);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};
var getMyBookings = async (req, res, next) => {
  const requester = getRequiredAuthenticatedUser2(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role !== "user") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  try {
    const bookings = await Bookings_default.find({ user: requester.id });
    res.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
};
var updateBookingById = async (req, res, next) => {
  const id = getIdParam3(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid booking id" });
    return;
  }
  const parsedBody = updateBookingBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid booking update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { bookingDate, slotId, serviceId, reportId } = parsedBody.data;
  if (slotId && !import_mongoose9.default.Types.ObjectId.isValid(slotId) || serviceId && !import_mongoose9.default.Types.ObjectId.isValid(serviceId) || reportId && !import_mongoose9.default.Types.ObjectId.isValid(reportId)) {
    res.status(400).json({ message: "Invalid booking references" });
    return;
  }
  try {
    const updatedBooking = await Bookings_default.findByIdAndUpdate(
      id,
      {
        ...bookingDate ? { bookingDate } : {},
        ...slotId ? { slot: slotId } : {},
        ...serviceId ? { service: serviceId } : {},
        ...reportId ? { report: reportId } : {}
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    );
    if (!updatedBooking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    res.status(200).json({ message: "Booking updated", booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};
var deleteBookingById = async (req, res, next) => {
  const id = getIdParam3(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid booking id" });
    return;
  }
  try {
    const deletedBooking = await Bookings_default.findByIdAndDelete(id);
    if (!deletedBooking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    res.status(200).json({ message: "Booking deleted" });
  } catch (error) {
    next(error);
  }
};
var changeBookingStatus = async (req, res, next) => {
  const id = getIdParam3(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid booking id" });
    return;
  }
  const parsedBody = changeBookingStatusBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid booking status payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  try {
    const updatedBooking = await Bookings_default.findByIdAndUpdate(
      id,
      { status: parsedBody.data.status },
      { returnDocument: "after", runValidators: true }
    );
    if (!updatedBooking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    res.status(200).json({ message: "Booking status changed", booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// src/routes/booking.routes.ts
var bookingRouter = (0, import_express4.Router)();
bookingRouter.use(authenticateBasicCredentials);
bookingRouter.post("/", authorize(["admin", "user"]), createBooking);
bookingRouter.get("/", authorize(["admin"]), getAllBookings);
bookingRouter.get("/me", authorize(["user"]), getMyBookings);
bookingRouter.get("/:id", authorize(["admin"]), getBookingById);
bookingRouter.patch("/:id", authorize(["admin"]), updateBookingById);
bookingRouter.delete("/:id", authorize(["admin"]), deleteBookingById);
bookingRouter.patch("/:id/status", authorize(["admin"]), changeBookingStatus);
var booking_routes_default = bookingRouter;

// src/routes/doctor.routes.ts
var import_express5 = require("express");

// src/controllers/doctor.controller.ts
var import_mongoose10 = __toESM(require("mongoose"), 1);

// src/validators/doctor.validator.ts
var import_zod5 = __toESM(require("zod"), 1);
var createDoctorBodySchema = import_zod5.default.object({
  doctorName: import_zod5.default.string().min(1),
  email: import_zod5.default.string().email(),
  phone: import_zod5.default.string().min(1),
  password: import_zod5.default.string().min(6),
  description: import_zod5.default.string().default(""),
  specialities: import_zod5.default.array(import_zod5.default.string().min(1)).default([])
});
var updateDoctorBodySchema = createDoctorBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/doctor.controller.ts
var getIdParam4 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose10.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var createDoctor = async (req, res, next) => {
  const parsedBody = createDoctorBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid doctor payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  try {
    const { password, ...rest } = parsedBody.data;
    const passwordHash = await hashPassword(password);
    const doctor = await Doctor_default.create({
      ...rest,
      passwordHash
    });
    res.status(201).json({ message: "Doctor created", doctor });
  } catch (error) {
    next(error);
  }
};
var getAllDoctors = async (_req, res, next) => {
  try {
    const doctors = await Doctor_default.find();
    res.status(200).json({ doctors });
  } catch (error) {
    next(error);
  }
};
var getDoctorById = async (req, res, next) => {
  const id = getIdParam4(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid doctor id" });
    return;
  }
  try {
    const doctor = await Doctor_default.findById(id);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    res.status(200).json({ doctor });
  } catch (error) {
    next(error);
  }
};
var updateDoctorById = async (req, res, next) => {
  const id = getIdParam4(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid doctor id" });
    return;
  }
  const parsedBody = updateDoctorBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid doctor update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { password, ...rest } = parsedBody.data;
  const hashedPassword = password ? await hashPassword(password) : null;
  const updatePayload = {
    ...rest,
    ...hashedPassword ? { passwordHash: hashedPassword } : {}
  };
  try {
    const updatedDoctor = await Doctor_default.findByIdAndUpdate(id, updatePayload, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedDoctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    res.status(200).json({ message: "Doctor updated", doctor: updatedDoctor });
  } catch (error) {
    next(error);
  }
};
var deleteDoctorById = async (req, res, next) => {
  const id = getIdParam4(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid doctor id" });
    return;
  }
  try {
    const deletedDoctor = await Doctor_default.findByIdAndDelete(id);
    if (!deletedDoctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    res.status(200).json({ message: "Doctor deleted" });
  } catch (error) {
    next(error);
  }
};

// src/routes/doctor.routes.ts
var doctorRouter = (0, import_express5.Router)();
doctorRouter.use(authenticateBasicCredentials);
doctorRouter.post("/", authorize(["admin"]), createDoctor);
doctorRouter.get("/", authorize(["admin"]), getAllDoctors);
doctorRouter.get("/:id", authorize(["doctor", "trainer"]), getDoctorById);
doctorRouter.patch("/:id", authorize(["doctor", "trainer"]), updateDoctorById);
doctorRouter.delete("/:id", authorize(["admin"]), deleteDoctorById);
var doctor_routes_default = doctorRouter;

// src/routes/lead.routes.ts
var import_express6 = require("express");

// src/controllers/lead.controller.ts
var import_mongoose12 = __toESM(require("mongoose"), 1);

// src/models/Lead.ts
var import_mongoose11 = __toESM(require("mongoose"), 1);
var leadSchema = new import_mongoose11.default.Schema(
  {
    leadName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    source: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: "New" /* New */,
      required: true
    },
    interestedIn: { type: String, default: "" },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    followUpDate: { type: Date, default: null },
    owner: { type: import_mongoose11.default.Schema.Types.ObjectId, ref: "Admin" },
    convertedUser: {
      type: import_mongoose11.default.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);
var Lead_default = import_mongoose11.default.models.Lead || import_mongoose11.default.model("Lead", leadSchema);

// src/validators/lead.validator.ts
var import_zod6 = __toESM(require("zod"), 1);
var leadStatusValues = Object.values(LeadStatus);
var genderValues2 = Object.values(Gender).map(String);
var createLeadBodySchema = import_zod6.default.object({
  leadName: import_zod6.default.string().trim().min(1),
  email: import_zod6.default.string().trim().email(),
  phone: import_zod6.default.string().trim().min(1).optional(),
  source: import_zod6.default.string().trim().min(1).optional(),
  interestedIn: import_zod6.default.string().trim().min(1).optional(),
  notes: import_zod6.default.string().trim().optional(),
  tags: import_zod6.default.array(import_zod6.default.string().trim().min(1)).default([]),
  followUpDate: import_zod6.default.string().trim().min(1).optional(),
  ownerId: import_zod6.default.string().trim().min(1).optional(),
  status: import_zod6.default.enum(leadStatusValues).optional()
});
var updateLeadBodySchema = createLeadBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});
var convertLeadBodySchema = import_zod6.default.object({
  username: import_zod6.default.string().trim().min(1).optional(),
  phone: import_zod6.default.string().trim().min(1),
  age: import_zod6.default.string().trim().min(1),
  gender: import_zod6.default.enum(genderValues2),
  healthGoals: import_zod6.default.array(import_zod6.default.string().trim().min(1)).default([]),
  password: import_zod6.default.string().min(1)
});

// src/controllers/lead.controller.ts
var parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
var getIdParam5 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose12.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var createLead = async (req, res, next) => {
  const parsedBody = createLeadBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid lead payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { ownerId, ...leadData } = parsedBody.data;
  const followUpDateValue = parseDateOrNull(parsedBody.data.followUpDate);
  if (parsedBody.data.followUpDate && !followUpDateValue) {
    res.status(400).json({ message: "Invalid followUpDate" });
    return;
  }
  if (ownerId && !import_mongoose12.default.Types.ObjectId.isValid(ownerId)) {
    res.status(400).json({ message: "Invalid ownerId" });
    return;
  }
  try {
    const lead = await Lead_default.create({
      ...leadData,
      ...followUpDateValue ? { followUpDate: followUpDateValue } : {},
      ...ownerId ? { owner: ownerId } : {}
    });
    res.status(201).json({ message: "Lead created", lead });
  } catch (error) {
    next(error);
  }
};
var getAllLeads = async (_req, res, next) => {
  try {
    const leads = await Lead_default.find();
    res.status(200).json({ leads });
  } catch (error) {
    next(error);
  }
};
var getLeadById = async (req, res, next) => {
  const id = getIdParam5(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }
  try {
    const lead = await Lead_default.findById(id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(200).json({ lead });
  } catch (error) {
    next(error);
  }
};
var updateLeadById = async (req, res, next) => {
  const id = getIdParam5(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }
  const parsedBody = updateLeadBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid lead update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { ownerId, ...payload } = parsedBody.data;
  const followUpDateValue = parseDateOrNull(parsedBody.data.followUpDate);
  if (parsedBody.data.followUpDate && !followUpDateValue) {
    res.status(400).json({ message: "Invalid followUpDate" });
    return;
  }
  if (ownerId && !import_mongoose12.default.Types.ObjectId.isValid(ownerId)) {
    res.status(400).json({ message: "Invalid ownerId" });
    return;
  }
  try {
    const updatedLead = await Lead_default.findByIdAndUpdate(
      id,
      {
        ...payload,
        ...followUpDateValue !== null ? { followUpDate: followUpDateValue } : {},
        ...ownerId ? { owner: ownerId } : {}
      },
      { returnDocument: "after", runValidators: true }
    );
    if (!updatedLead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(200).json({ message: "Lead updated", lead: updatedLead });
  } catch (error) {
    next(error);
  }
};
var deleteLeadById = async (req, res, next) => {
  const id = getIdParam5(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }
  try {
    const deletedLead = await Lead_default.findByIdAndDelete(id);
    if (!deletedLead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(200).json({ message: "Lead deleted" });
  } catch (error) {
    next(error);
  }
};
var convertLeadToUser = async (req, res, next) => {
  const id = getIdParam5(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }
  const parsedBody = convertLeadBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid lead conversion payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  try {
    const lead = await Lead_default.findById(id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    if (lead.status === "Converted" /* Converted */ && lead.convertedUser) {
      res.status(409).json({
        message: "Lead already converted",
        userId: lead.convertedUser
      });
      return;
    }
    const existingUser = await User_default.findOne({ email: lead.email });
    if (existingUser) {
      lead.status = "Converted" /* Converted */;
      lead.convertedUser = existingUser._id;
      await lead.save();
      res.status(200).json({
        message: "Lead linked to existing user",
        lead,
        userId: existingUser._id
      });
      return;
    }
    const { username, phone, age, gender, healthGoals, password } = parsedBody.data;
    const passwordHash = await hashPassword(password);
    const createdUser = await User_default.create({
      username: username ?? lead.leadName,
      phone,
      email: lead.email,
      age,
      gender,
      healthGoals,
      passwordHash
    });
    lead.status = "Converted" /* Converted */;
    lead.convertedUser = createdUser._id;
    await lead.save();
    res.status(201).json({
      message: "Lead converted to user",
      lead,
      user: {
        id: createdUser._id,
        email: createdUser.email,
        role: "user"
      }
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/lead.routes.ts
var leadRouter = (0, import_express6.Router)();
leadRouter.use(authenticateBasicCredentials);
leadRouter.post("/", authorize(["admin", "doctor", "trainer"]), createLead);
leadRouter.get("/", authorize(["admin"]), getAllLeads);
leadRouter.get("/:id", authorize(["admin", "doctor", "trainer"]), getLeadById);
leadRouter.patch("/:id", authorize(["admin", "doctor", "trainer"]), updateLeadById);
leadRouter.delete("/:id", authorize(["admin"]), deleteLeadById);
leadRouter.post(
  "/:id/convert",
  authorize(["admin"]),
  convertLeadToUser
);
var lead_routes_default = leadRouter;

// src/routes/membership.routes.ts
var import_express7 = require("express");

// src/controllers/membership.controller.ts
var import_mongoose14 = __toESM(require("mongoose"), 1);

// src/models/Membership.ts
var import_mongoose13 = __toESM(require("mongoose"), 1);
var membershipSchema = new import_mongoose13.default.Schema(
  {
    user: { type: import_mongoose13.default.Schema.Types.ObjectId, ref: "User", required: true },
    planName: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: "Active" /* Active */,
      required: true
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    features: { type: [String], default: [] },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);
var Membership_default = import_mongoose13.default.models.Membership || import_mongoose13.default.model("Membership", membershipSchema);

// src/validators/membership.validator.ts
var import_zod7 = __toESM(require("zod"), 1);
var membershipStatusValues = Object.values(MembershipStatus).map(String);
var createMembershipBodySchema = import_zod7.default.object({
  userId: import_zod7.default.string().trim().optional(),
  planName: import_zod7.default.string().trim().min(1),
  status: import_zod7.default.enum(membershipStatusValues).optional(),
  price: import_zod7.default.number().nonnegative(),
  currency: import_zod7.default.string().trim().min(1).default("USD"),
  startDate: import_zod7.default.string().trim().min(1),
  endDate: import_zod7.default.string().trim().optional(),
  features: import_zod7.default.array(import_zod7.default.string().trim().min(1)).default([]),
  notes: import_zod7.default.string().trim().optional()
});
var updateMembershipBodySchema = createMembershipBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/membership.controller.ts
var getIdParam6 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose14.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var parseDateOrNull2 = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
var requireAuthenticatedUser = (req) => {
  if (!req.user) {
    return null;
  }
  return req.user;
};
var createMembership = async (req, res, next) => {
  const parsedBody = createMembershipBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid membership payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const requester = requireAuthenticatedUser(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role !== "admin") {
    res.status(403).json({ message: "Only admins can create memberships" });
    return;
  }
  const { userId, startDate, endDate, ...rest } = parsedBody.data;
  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }
  if (!import_mongoose14.default.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid userId" });
    return;
  }
  const startDateValue = parseDateOrNull2(startDate);
  const endDateValue = parseDateOrNull2(endDate);
  if (!startDateValue) {
    res.status(400).json({ message: "Invalid startDate" });
    return;
  }
  if (endDate && !endDateValue) {
    res.status(400).json({ message: "Invalid endDate" });
    return;
  }
  if (startDateValue && endDateValue && endDateValue < startDateValue) {
    res.status(400).json({ message: "endDate cannot be before startDate" });
    return;
  }
  try {
    const membership = await Membership_default.create({
      ...rest,
      user: userId,
      startDate: startDateValue,
      ...endDateValue ? { endDate: endDateValue } : {}
    });
    res.status(201).json({ message: "Membership created", membership });
  } catch (error) {
    next(error);
  }
};
var getAllMemberships = async (_req, res, next) => {
  try {
    const memberships = await Membership_default.find();
    res.status(200).json({ memberships });
  } catch (error) {
    next(error);
  }
};
var getMembershipById = async (req, res, next) => {
  const id = getIdParam6(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid membership id" });
    return;
  }
  try {
    const membership = await Membership_default.findById(id);
    if (!membership) {
      res.status(404).json({ message: "Membership not found" });
      return;
    }
    res.status(200).json({ membership });
  } catch (error) {
    next(error);
  }
};
var getMyMemberships = async (req, res, next) => {
  const requester = requireAuthenticatedUser(req);
  if (!requester || requester.role !== "user") {
    res.status(403).json({ message: "Only users can access this endpoint" });
    return;
  }
  try {
    const memberships = await Membership_default.find({ user: requester.id });
    res.status(200).json({ memberships });
  } catch (error) {
    next(error);
  }
};
var updateMembershipById = async (req, res, next) => {
  const id = getIdParam6(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid membership id" });
    return;
  }
  const parsedBody = updateMembershipBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid membership update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { userId, startDate, endDate, ...rest } = parsedBody.data;
  if (userId && !import_mongoose14.default.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid userId" });
    return;
  }
  const startDateValue = startDate ? parseDateOrNull2(startDate) : null;
  const endDateValue = endDate ? parseDateOrNull2(endDate) : null;
  if (startDate && !startDateValue) {
    res.status(400).json({ message: "Invalid startDate" });
    return;
  }
  if (endDate && !endDateValue) {
    res.status(400).json({ message: "Invalid endDate" });
    return;
  }
  if (startDateValue && endDateValue && endDateValue < startDateValue) {
    res.status(400).json({ message: "endDate cannot be before startDate" });
    return;
  }
  try {
    const updatedMembership = await Membership_default.findByIdAndUpdate(
      id,
      {
        ...userId ? { user: userId } : {},
        ...startDateValue ? { startDate: startDateValue } : {},
        ...endDateValue ? { endDate: endDateValue } : {},
        ...rest
      },
      { returnDocument: "after", runValidators: true }
    );
    if (!updatedMembership) {
      res.status(404).json({ message: "Membership not found" });
      return;
    }
    res.status(200).json({ message: "Membership updated", membership: updatedMembership });
  } catch (error) {
    next(error);
  }
};
var deleteMembershipById = async (req, res, next) => {
  const id = getIdParam6(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid membership id" });
    return;
  }
  try {
    const deletedMembership = await Membership_default.findByIdAndDelete(id);
    if (!deletedMembership) {
      res.status(404).json({ message: "Membership not found" });
      return;
    }
    res.status(200).json({ message: "Membership deleted" });
  } catch (error) {
    next(error);
  }
};

// src/routes/membership.routes.ts
var membershipRouter = (0, import_express7.Router)();
membershipRouter.use(authenticateBasicCredentials);
membershipRouter.post("/", authorize(["admin"]), createMembership);
membershipRouter.get("/", authorize(["admin"]), getAllMemberships);
membershipRouter.get("/me", authorize(["user"]), getMyMemberships);
membershipRouter.get("/:id", authorize(["admin"]), getMembershipById);
membershipRouter.patch("/:id", authorize(["admin"]), updateMembershipById);
membershipRouter.delete("/:id", authorize(["admin"]), deleteMembershipById);
var membership_routes_default = membershipRouter;

// src/routes/schedule.routes.ts
var import_express8 = __toESM(require("express"), 1);

// src/controllers/schedule.controller.ts
var import_mongoose16 = __toESM(require("mongoose"), 1);

// src/models/Schedule.ts
var import_mongoose15 = __toESM(require("mongoose"), 1);
var scheduleSchema = new import_mongoose15.default.Schema(
  {
    user: { type: import_mongoose15.default.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(TodoStatus),
      default: 0 /* Todo */,
      required: true
    },
    todos: [
      { type: import_mongoose15.default.Schema.Types.ObjectId, ref: "Todo", required: true }
    ]
  },
  { timestamps: true }
);
var Schedule_default = import_mongoose15.default.models.Schedule || import_mongoose15.default.model("Schedule", scheduleSchema);

// src/validators/schedule.validator.ts
var import_zod8 = __toESM(require("zod"), 1);
var createScheduleBodySchema = import_zod8.default.object({
  userId: import_zod8.default.string().min(1),
  scheduledDate: import_zod8.default.coerce.date(),
  status: import_zod8.default.coerce.number().refine((value) => value in TodoStatus, {
    message: "Invalid schedule status"
  }).optional().default(0 /* Todo */),
  todoIds: import_zod8.default.array(import_zod8.default.string().min(1)).optional().default([])
});
var updateScheduleBodySchema = import_zod8.default.object({
  scheduledDate: import_zod8.default.coerce.date().optional(),
  status: import_zod8.default.coerce.number().refine((value) => value in TodoStatus, {
    message: "Invalid schedule status"
  }).optional(),
  todoIds: import_zod8.default.array(import_zod8.default.string().min(1)).optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});
var rescheduleBodySchema = import_zod8.default.object({
  newScheduledDate: import_zod8.default.coerce.date()
});

// src/controllers/schedule.controller.ts
var getIdParam7 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose16.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var getRequiredAuthenticatedUser3 = (req) => {
  if (!req.user) {
    return null;
  }
  return req.user;
};
var isWithinSevenDays = (date) => {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const timeDiff = target.getTime() - today.getTime();
  const daysDiff = timeDiff / (1e3 * 3600 * 24);
  return daysDiff >= 0 && daysDiff <= 7;
};
var getMySchedule = async (req, res, next) => {
  const requester = getRequiredAuthenticatedUser3(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const schedule = await Schedule_default.findOne({ user: requester.id }).populate("user", "username email").populate("todos");
    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }
    res.status(200).json({ message: "Schedule retrieved", schedule });
  } catch (error) {
    next(error);
  }
};
var createSchedule = async (req, res, next) => {
  const parsedBody = createScheduleBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid schedule payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const requester = getRequiredAuthenticatedUser3(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const { userId, scheduledDate, status, todoIds } = parsedBody.data;
  if (requester.role === "user" && userId !== requester.id) {
    res.status(403).json({
      message: "Users can only create schedules for themselves"
    });
    return;
  }
  if (!import_mongoose16.default.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid userId" });
    return;
  }
  if (todoIds && todoIds.length > 0 && !todoIds.every((id) => import_mongoose16.default.Types.ObjectId.isValid(id))) {
    res.status(400).json({ message: "Invalid todo IDs" });
    return;
  }
  try {
    const userExists = await User_default.findById(userId);
    if (!userExists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const schedule = await Schedule_default.create({
      user: userId,
      scheduledDate,
      status,
      todos: todoIds || []
    });
    const populatedSchedule = await Schedule_default.findById(schedule._id).populate("user", "username email").populate("todos");
    res.status(201).json({
      message: "Schedule created successfully",
      schedule: populatedSchedule
    });
  } catch (error) {
    next(error);
  }
};
var getScheduleByUserId = async (req, res, next) => {
  const userId = getIdParam7(req.params.userId);
  if (!userId) {
    res.status(400).json({ message: "Invalid userId format" });
    return;
  }
  const requester = getRequiredAuthenticatedUser3(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role === "user" && userId !== requester.id) {
    res.status(403).json({
      message: "Users can only view their own schedule"
    });
    return;
  }
  try {
    const schedule = await Schedule_default.findOne({ user: userId }).populate("user", "username email").populate("todos");
    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }
    res.status(200).json({
      message: "Schedule retrieved successfully",
      schedule
    });
  } catch (error) {
    next(error);
  }
};
var updateSchedule = async (req, res, next) => {
  const userId = getIdParam7(req.params.userId);
  if (!userId) {
    res.status(400).json({ message: "Invalid userId format" });
    return;
  }
  const parsedBody = updateScheduleBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid schedule payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const requester = getRequiredAuthenticatedUser3(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role === "user" && userId !== requester.id) {
    res.status(403).json({
      message: "Users can only edit their own schedule"
    });
    return;
  }
  const { scheduledDate, status, todoIds } = parsedBody.data;
  if (todoIds && todoIds.length > 0 && !todoIds.every((id) => import_mongoose16.default.Types.ObjectId.isValid(id))) {
    res.status(400).json({ message: "Invalid todo IDs" });
    return;
  }
  try {
    const schedule = await Schedule_default.findOne({ user: userId });
    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }
    if (scheduledDate !== void 0) {
      schedule.scheduledDate = scheduledDate;
    }
    if (status !== void 0) {
      schedule.status = status;
    }
    if (todoIds !== void 0) {
      schedule.todos = todoIds.map(
        (todoId) => new import_mongoose16.default.Types.ObjectId(todoId)
      );
    }
    await schedule.save();
    const updatedSchedule = await Schedule_default.findOne({ user: userId }).populate("user", "username email").populate("todos");
    res.status(200).json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
};
var rescheduleSchedule = async (req, res, next) => {
  const userId = getIdParam7(req.params.userId);
  if (!userId) {
    res.status(400).json({ message: "Invalid userId format" });
    return;
  }
  const parsedBody = rescheduleBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid reschedule payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const requester = getRequiredAuthenticatedUser3(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role === "user" && userId !== requester.id) {
    res.status(403).json({
      message: "Users can only reschedule their own schedule"
    });
    return;
  }
  const { newScheduledDate } = parsedBody.data;
  if (!isWithinSevenDays(newScheduledDate)) {
    res.status(400).json({
      message: "Schedule can only be rescheduled within the next 7 days"
    });
    return;
  }
  try {
    const schedule = await Schedule_default.findOne({ user: userId });
    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }
    schedule.scheduledDate = newScheduledDate;
    await schedule.save();
    const updatedSchedule = await Schedule_default.findOne({ user: userId }).populate("user", "username email").populate("todos");
    res.status(200).json({
      message: "Schedule rescheduled successfully",
      schedule: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
};
var deleteSchedule = async (req, res, next) => {
  const userId = getIdParam7(req.params.userId);
  if (!userId) {
    res.status(400).json({ message: "Invalid userId format" });
    return;
  }
  const requester = getRequiredAuthenticatedUser3(req);
  if (!requester) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (requester.role !== "admin") {
    res.status(403).json({
      message: "Only admins can delete schedules"
    });
    return;
  }
  try {
    const schedule = await Schedule_default.findOneAndDelete({ user: userId });
    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// src/routes/schedule.routes.ts
var scheduleRouter = import_express8.default.Router();
scheduleRouter.use(authenticateBasicCredentials);
scheduleRouter.get("/my-schedule", getMySchedule);
scheduleRouter.post(
  "/",
  authorize(["user", "doctor", "trainer", "admin"]),
  createSchedule
);
scheduleRouter.get(
  "/:userId",
  authorize(["user", "doctor", "trainer", "admin"]),
  getScheduleByUserId
);
scheduleRouter.patch(
  "/:userId",
  authorize(["user", "doctor", "trainer", "admin"]),
  updateSchedule
);
scheduleRouter.patch(
  "/:userId/reschedule",
  authorize(["user", "doctor", "trainer", "admin"]),
  rescheduleSchedule
);
scheduleRouter.delete(
  "/:userId",
  authorize(["admin"]),
  deleteSchedule
);
var schedule_routes_default = scheduleRouter;

// src/routes/service.routes.ts
var import_express9 = require("express");

// src/controllers/service.controller.ts
var import_mongoose18 = __toESM(require("mongoose"), 1);

// src/models/Service.ts
var import_mongoose17 = __toESM(require("mongoose"), 1);
var serviceSchema = new import_mongoose17.default.Schema(
  {
    serviceName: { type: String, required: true },
    serviceTime: { type: Number, required: true },
    description: { type: String, required: true },
    tags: { type: [String], default: [] },
    slots: [
      {
        type: import_mongoose17.default.Schema.Types.ObjectId,
        ref: "Slot",
        required: true
      }
    ]
  },
  { timestamps: true }
);
var Service_default = import_mongoose17.default.models.Service || import_mongoose17.default.model("Service", serviceSchema);

// src/validators/service.validator.ts
var import_zod9 = __toESM(require("zod"), 1);
var createServiceBodySchema = import_zod9.default.object({
  serviceName: import_zod9.default.string().min(1),
  serviceTime: import_zod9.default.coerce.number().positive(),
  description: import_zod9.default.string().min(1),
  tags: import_zod9.default.array(import_zod9.default.string().min(1)).default([]),
  slots: import_zod9.default.array(import_zod9.default.string().min(1)).min(1)
});
var updateServiceBodySchema = import_zod9.default.object({
  serviceName: import_zod9.default.string().min(1).optional(),
  serviceTime: import_zod9.default.coerce.number().positive().optional(),
  description: import_zod9.default.string().min(1).optional(),
  tags: import_zod9.default.array(import_zod9.default.string().min(1)).optional(),
  slots: import_zod9.default.array(import_zod9.default.string().min(1)).min(1).optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/service.controller.ts
var getIdParam8 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose18.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var areValidObjectIds = (ids) => ids.every((id) => import_mongoose18.default.Types.ObjectId.isValid(id));
var createService = async (req, res, next) => {
  const parsedBody = createServiceBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid service payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  if (!areValidObjectIds(parsedBody.data.slots)) {
    res.status(400).json({ message: "Invalid slot references" });
    return;
  }
  try {
    const service = await Service_default.create(parsedBody.data);
    res.status(201).json({ message: "Service created", service });
  } catch (error) {
    next(error);
  }
};
var getAllServices = async (_req, res, next) => {
  try {
    const services = await Service_default.find();
    res.status(200).json({ services });
  } catch (error) {
    next(error);
  }
};
var getServiceById = async (req, res, next) => {
  const id = getIdParam8(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id" });
    return;
  }
  try {
    const service = await Service_default.findById(id);
    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    res.status(200).json({ service });
  } catch (error) {
    next(error);
  }
};
var updateServiceById = async (req, res, next) => {
  const id = getIdParam8(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id" });
    return;
  }
  const parsedBody = updateServiceBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid service update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  if (parsedBody.data.slots && !areValidObjectIds(parsedBody.data.slots)) {
    res.status(400).json({ message: "Invalid slot references" });
    return;
  }
  try {
    const updatedService = await Service_default.findByIdAndUpdate(
      id,
      parsedBody.data,
      {
        returnDocument: "after",
        runValidators: true
      }
    );
    if (!updatedService) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    res.status(200).json({ message: "Service updated", service: updatedService });
  } catch (error) {
    next(error);
  }
};
var deleteServiceById = async (req, res, next) => {
  const id = getIdParam8(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid service id" });
    return;
  }
  try {
    const deletedService = await Service_default.findByIdAndDelete(id);
    if (!deletedService) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    next(error);
  }
};

// src/routes/service.routes.ts
var serviceRouter = (0, import_express9.Router)();
serviceRouter.use(authenticateBasicCredentials);
serviceRouter.get(
  "/",
  authorize(["admin", "doctor", "trainer", "user"]),
  getAllServices
);
serviceRouter.get(
  "/:id",
  authorize(["admin", "doctor", "trainer", "user"]),
  getServiceById
);
serviceRouter.post("/", authorize(["admin"]), createService);
serviceRouter.patch("/:id", authorize(["admin"]), updateServiceById);
serviceRouter.delete("/:id", authorize(["admin"]), deleteServiceById);
var service_routes_default = serviceRouter;

// src/routes/slot.routes.ts
var import_express10 = require("express");

// src/controllers/slot.controller.ts
var import_mongoose20 = __toESM(require("mongoose"), 1);

// src/models/Slots.ts
var import_mongoose19 = __toESM(require("mongoose"), 1);
var slotSchema = new import_mongoose19.default.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, requried: true }
  },
  { timestamps: true }
);
var Slots_default = import_mongoose19.default.models.Slot || import_mongoose19.default.model("Slot", slotSchema);

// src/validators/slot.validator.ts
var import_zod10 = __toESM(require("zod"), 1);
var createSlotBodySchema = import_zod10.default.object({
  date: import_zod10.default.coerce.date(),
  startTime: import_zod10.default.string().min(1),
  endTime: import_zod10.default.string().min(1),
  isBooked: import_zod10.default.boolean().default(false)
});
var updateSlotBodySchema = createSlotBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/slot.controller.ts
var getIdParam9 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose20.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var createSlot = async (req, res, next) => {
  const parsedBody = createSlotBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid slot payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  try {
    const slot = await Slots_default.create(parsedBody.data);
    res.status(201).json({ message: "Slot created", slot });
  } catch (error) {
    next(error);
  }
};
var getAllSlots = async (_req, res, next) => {
  try {
    const slots = await Slots_default.find();
    res.status(200).json({ slots });
  } catch (error) {
    next(error);
  }
};
var getSlotById = async (req, res, next) => {
  const id = getIdParam9(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid slot id" });
    return;
  }
  try {
    const slot = await Slots_default.findById(id);
    if (!slot) {
      res.status(404).json({ message: "Slot not found" });
      return;
    }
    res.status(200).json({ slot });
  } catch (error) {
    next(error);
  }
};
var updateSlotById = async (req, res, next) => {
  const id = getIdParam9(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid slot id" });
    return;
  }
  const parsedBody = updateSlotBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid slot update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  try {
    const updatedSlot = await Slots_default.findByIdAndUpdate(id, parsedBody.data, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedSlot) {
      res.status(404).json({ message: "Slot not found" });
      return;
    }
    res.status(200).json({ message: "Slot updated", slot: updatedSlot });
  } catch (error) {
    next(error);
  }
};
var deleteSlotById = async (req, res, next) => {
  const id = getIdParam9(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid slot id" });
    return;
  }
  try {
    const deletedSlot = await Slots_default.findByIdAndDelete(id);
    if (!deletedSlot) {
      res.status(404).json({ message: "Slot not found" });
      return;
    }
    res.status(200).json({ message: "Slot deleted" });
  } catch (error) {
    next(error);
  }
};

// src/routes/slot.routes.ts
var slotRouter = (0, import_express10.Router)();
slotRouter.use(authenticateBasicCredentials);
slotRouter.use(authorize(["admin"]));
slotRouter.post("/", createSlot);
slotRouter.get("/", getAllSlots);
slotRouter.get("/:id", getSlotById);
slotRouter.patch("/:id", updateSlotById);
slotRouter.delete("/:id", deleteSlotById);
var slot_routes_default = slotRouter;

// src/routes/therapy.routes.ts
var import_express11 = require("express");

// src/controllers/therapy.controller.ts
var import_mongoose22 = __toESM(require("mongoose"), 1);

// src/models/Therapy.ts
var import_mongoose21 = __toESM(require("mongoose"), 1);
var therapySchema = new import_mongoose21.default.Schema(
  {
    therapyName: { type: String, required: true },
    therapyTime: { type: Number, required: true },
    description: { type: String, required: true },
    tags: { type: [String], default: [] },
    slots: [
      {
        type: import_mongoose21.default.Schema.Types.ObjectId,
        ref: "Slot",
        required: true
      }
    ]
  },
  { timestamps: true }
);
var Therapy_default = import_mongoose21.default.models.Therapy || import_mongoose21.default.model("Therapy", therapySchema);

// src/validators/therapy.validator.ts
var import_zod11 = __toESM(require("zod"), 1);
var createTherapyBodySchema = import_zod11.default.object({
  therapyName: import_zod11.default.string().min(1),
  therapyTime: import_zod11.default.coerce.number().positive(),
  description: import_zod11.default.string().min(1),
  tags: import_zod11.default.array(import_zod11.default.string().min(1)).default([]),
  slots: import_zod11.default.array(import_zod11.default.string().min(1)).min(1)
});
var updateTherapyBodySchema = import_zod11.default.object({
  therapyName: import_zod11.default.string().min(1).optional(),
  therapyTime: import_zod11.default.coerce.number().positive().optional(),
  description: import_zod11.default.string().min(1).optional(),
  tags: import_zod11.default.array(import_zod11.default.string().min(1)).optional(),
  slots: import_zod11.default.array(import_zod11.default.string().min(1)).min(1).optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/therapy.controller.ts
var getIdParam10 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose22.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var areValidObjectIds2 = (ids) => ids.every((id) => import_mongoose22.default.Types.ObjectId.isValid(id));
var createTherapy = async (req, res, next) => {
  const parsedBody = createTherapyBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid therapy payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  if (!areValidObjectIds2(parsedBody.data.slots)) {
    res.status(400).json({ message: "Invalid slot references" });
    return;
  }
  try {
    const therapy = await Therapy_default.create(parsedBody.data);
    res.status(201).json({ message: "Therapy created", therapy });
  } catch (error) {
    next(error);
  }
};
var getAllTherapies = async (_req, res, next) => {
  try {
    const therapies = await Therapy_default.find();
    res.status(200).json({ therapies });
  } catch (error) {
    next(error);
  }
};
var getTherapyById = async (req, res, next) => {
  const id = getIdParam10(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid therapy id" });
    return;
  }
  try {
    const therapy = await Therapy_default.findById(id);
    if (!therapy) {
      res.status(404).json({ message: "Therapy not found" });
      return;
    }
    res.status(200).json({ therapy });
  } catch (error) {
    next(error);
  }
};
var updateTherapyById = async (req, res, next) => {
  const id = getIdParam10(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid therapy id" });
    return;
  }
  const parsedBody = updateTherapyBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid therapy update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  if (parsedBody.data.slots && !areValidObjectIds2(parsedBody.data.slots)) {
    res.status(400).json({ message: "Invalid slot references" });
    return;
  }
  try {
    const updatedTherapy = await Therapy_default.findByIdAndUpdate(
      id,
      parsedBody.data,
      {
        returnDocument: "after",
        runValidators: true
      }
    );
    if (!updatedTherapy) {
      res.status(404).json({ message: "Therapy not found" });
      return;
    }
    res.status(200).json({ message: "Therapy updated", therapy: updatedTherapy });
  } catch (error) {
    next(error);
  }
};
var deleteTherapyById = async (req, res, next) => {
  const id = getIdParam10(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid therapy id" });
    return;
  }
  try {
    const deletedTherapy = await Therapy_default.findByIdAndDelete(id);
    if (!deletedTherapy) {
      res.status(404).json({ message: "Therapy not found" });
      return;
    }
    res.status(200).json({ message: "Therapy deleted" });
  } catch (error) {
    next(error);
  }
};

// src/routes/therapy.routes.ts
var therapyRouter = (0, import_express11.Router)();
therapyRouter.use(authenticateBasicCredentials);
therapyRouter.get(
  "/",
  authorize(["admin", "doctor", "trainer", "user"]),
  getAllTherapies
);
therapyRouter.get(
  "/:id",
  authorize(["admin", "doctor", "trainer", "user"]),
  getTherapyById
);
therapyRouter.post("/", authorize(["admin"]), createTherapy);
therapyRouter.patch("/:id", authorize(["admin"]), updateTherapyById);
therapyRouter.delete("/:id", authorize(["admin"]), deleteTherapyById);
var therapy_routes_default = therapyRouter;

// src/routes/trainer.routes.ts
var import_express12 = require("express");

// src/controllers/trainer.controller.ts
var import_mongoose23 = __toESM(require("mongoose"), 1);

// src/validators/trainer.validator.ts
var import_zod12 = __toESM(require("zod"), 1);
var createTrainerBodySchema = import_zod12.default.object({
  trainerName: import_zod12.default.string().min(1),
  email: import_zod12.default.email(),
  phone: import_zod12.default.string().min(1),
  password: import_zod12.default.string().min(6),
  description: import_zod12.default.string().default(""),
  specialities: import_zod12.default.array(import_zod12.default.string().min(1)).default([])
});
var updateTrainerBodySchema = createTrainerBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/trainer.controller.ts
var getIdParam11 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose23.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var createTrainer = async (req, res, next) => {
  const parsedBody = createTrainerBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid trainer payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  try {
    const { password, ...rest } = parsedBody.data;
    const passwordHash = await hashPassword(password);
    const trainer = await Trainer_default.create({
      ...rest,
      passwordHash
    });
    res.status(201).json({ message: "Trainer created", trainer });
  } catch (error) {
    next(error);
  }
};
var getAllTrainers = async (_req, res, next) => {
  try {
    const trainers = await Trainer_default.find();
    res.status(200).json({ trainers });
  } catch (error) {
    next(error);
  }
};
var getTrainerById = async (req, res, next) => {
  const id = getIdParam11(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid trainer id" });
    return;
  }
  try {
    const trainer = await Trainer_default.findById(id);
    if (!trainer) {
      res.status(404).json({ message: "Trainer not found" });
      return;
    }
    res.status(200).json({ trainer });
  } catch (error) {
    next(error);
  }
};
var updateTrainerById = async (req, res, next) => {
  const id = getIdParam11(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid trainer id" });
    return;
  }
  const parsedBody = updateTrainerBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid trainer update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { password, ...rest } = parsedBody.data;
  const hashedPassword = password ? await hashPassword(password) : null;
  const updatePayload = {
    ...rest,
    ...hashedPassword ? { passwordHash: hashedPassword } : {}
  };
  try {
    const updatedTrainer = await Trainer_default.findByIdAndUpdate(id, updatePayload, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedTrainer) {
      res.status(404).json({ message: "Trainer not found" });
      return;
    }
    res.status(200).json({ message: "Trainer updated", trainer: updatedTrainer });
  } catch (error) {
    next(error);
  }
};
var deleteTrainerById = async (req, res, next) => {
  const id = getIdParam11(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid trainer id" });
    return;
  }
  try {
    const deletedTrainer = await Trainer_default.findByIdAndDelete(id);
    if (!deletedTrainer) {
      res.status(404).json({ message: "Trainer not found" });
      return;
    }
    res.status(200).json({ message: "Trainer deleted" });
  } catch (error) {
    next(error);
  }
};

// src/routes/trainer.routes.ts
var trainerRouter = (0, import_express12.Router)();
trainerRouter.use(authenticateBasicCredentials);
trainerRouter.post("/", authorize(["admin"]), createTrainer);
trainerRouter.get("/", authorize(["admin"]), getAllTrainers);
trainerRouter.get("/:id", authorize(["trainer", "doctor"]), getTrainerById);
trainerRouter.patch(
  "/:id",
  authorize(["trainer", "doctor"]),
  updateTrainerById
);
trainerRouter.delete("/:id", authorize(["admin"]), deleteTrainerById);
var trainer_routes_default = trainerRouter;

// src/routes/user.routes.ts
var import_express13 = require("express");

// src/controllers/user.controller.ts
var import_mongoose24 = __toESM(require("mongoose"), 1);

// src/validators/user.validator.ts
var import_zod13 = __toESM(require("zod"), 1);
var genderValues3 = Object.values(Gender).map(String);
var requiredString = import_zod13.default.string().trim().min(1);
var requiredAgeString = import_zod13.default.preprocess((value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
}, import_zod13.default.string().min(1));
var requiredGenderString = import_zod13.default.preprocess((value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.toLowerCase() === "other") {
      return "Others";
    }
    return normalized;
  }
  return value;
}, import_zod13.default.enum(genderValues3));
var optionalString = import_zod13.default.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return void 0;
  }
  return value;
}, import_zod13.default.string().trim().min(1).optional());
var optionalAgeString = import_zod13.default.preprocess((value) => {
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value === "string" && value.trim() === "") {
    return void 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
}, import_zod13.default.string().min(1).optional());
var optionalGenderString = import_zod13.default.preprocess((value) => {
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value === "string" && value.trim() === "") {
    return void 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.toLowerCase() === "other") {
      return "Others";
    }
    return normalized;
  }
  return value;
}, import_zod13.default.enum(genderValues3).optional());
var createUserBodySchema = import_zod13.default.object({
  username: requiredString,
  phone: requiredString,
  email: import_zod13.default.string().email(),
  age: requiredAgeString,
  gender: requiredGenderString,
  healthGoals: import_zod13.default.array(import_zod13.default.string().trim().min(1)).default([]),
  password: import_zod13.default.string().min(6),
  onboarded: import_zod13.default.boolean().optional().default(false)
});
var updateUserBodySchema = import_zod13.default.object({
  username: optionalString,
  phone: optionalString,
  email: import_zod13.default.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return void 0;
    }
    return value;
  }, import_zod13.default.string().email().optional()),
  age: optionalAgeString,
  gender: optionalGenderString,
  healthGoals: import_zod13.default.array(import_zod13.default.string().trim().min(1)).optional(),
  password: import_zod13.default.string().min(6).optional(),
  onboarded: import_zod13.default.boolean().optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one field is required"
});

// src/controllers/user.controller.ts
var canOnboard = (requester, targetUserId) => {
  if (!requester) return false;
  if (requester.role === "admin") return true;
  return requester.role === "user" && requester.id === targetUserId;
};
var getIdParam12 = (idParam) => {
  if (typeof idParam !== "string" || !import_mongoose24.default.Types.ObjectId.isValid(idParam)) {
    return null;
  }
  return idParam;
};
var createUser = async (req, res, next) => {
  const parsedBody = createUserBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid user payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { password, onboarded = false, ...rest } = parsedBody.data;
  try {
    const passwordHash = await hashPassword(password);
    const existingUser = await User_default.findOne({
      email: parsedBody.data.email
    }).select("_id");
    if (existingUser) {
      res.status(409).json({ message: "User with this email already exists" });
      return;
    }
    const user = await User_default.create({
      ...rest,
      onboarded,
      passwordHash
    });
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    next(error);
  }
};
var getAllUsers = async (_req, res, next) => {
  try {
    const users = await User_default.find();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};
var getMyUser = async (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    res.status(403).json({ message: "Only users can access this endpoint" });
    return;
  }
  try {
    const user = await User_default.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
var getUserById = async (req, res, next) => {
  const id = getIdParam12(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }
  try {
    const user = await User_default.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
var updateUserById = async (req, res, next) => {
  const id = getIdParam12(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }
  const parsedBody = updateUserBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid user update payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { password, ...rest } = parsedBody.data;
  const hashedPassword = password ? await hashPassword(password) : null;
  const updatePayload = {
    ...rest,
    ...hashedPassword ? { passwordHash: hashedPassword } : {}
  };
  try {
    const updatedUser = await User_default.findByIdAndUpdate(id, updatePayload, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ message: "User updated", user: updatedUser });
  } catch (error) {
    next(error);
  }
};
var deleteUserById = async (req, res, next) => {
  const id = getIdParam12(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }
  try {
    const deletedUser = await User_default.findByIdAndDelete(id);
    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};
var onboardUser = async (req, res, next) => {
  const id = getIdParam12(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }
  if (!req.user || !canOnboard(req.user, id)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  const parsedBody = updateUserBodySchema.safeParse({
    ...req.body,
    onboarded: true
  });
  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid onboarding payload",
      errors: parsedBody.error.issues
    });
    return;
  }
  const { password, ...rest } = parsedBody.data;
  const hashedPassword = password ? await hashPassword(password) : null;
  const updatePayload = {
    ...rest,
    ...hashedPassword ? { passwordHash: hashedPassword } : {}
  };
  try {
    const updatedUser = await User_default.findByIdAndUpdate(id, updatePayload, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({
      message: "User onboarded",
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// src/routes/user.routes.ts
var userRouter = (0, import_express13.Router)();
userRouter.use(authenticateBasicCredentials);
userRouter.post("/", authorize(["admin"]), createUser);
userRouter.get("/", authorize(["admin", "doctor"]), getAllUsers);
userRouter.get("/me", authorize(["user"]), getMyUser);
userRouter.get("/:id", authorize(["admin", "doctor"]), getUserById);
userRouter.patch(
  "/:id/onboard",
  authorize(["admin", "user"]),
  onboardUser
);
userRouter.patch("/:id", authorize(["admin"]), updateUserById);
userRouter.delete("/:id", authorize(["admin"]), deleteUserById);
var user_routes_default = userRouter;

// src/routes/webhook.route.ts
var import_express14 = require("express");
var import_mongoose26 = __toESM(require("mongoose"), 1);

// src/utils/email.service.ts
var import_googleapis = require("googleapis");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var oauth2Client = new import_googleapis.google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});
var gmail = import_googleapis.google.gmail({ version: "v1", auth: oauth2Client });
var decodeBase64 = (data) => {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
};
var extractTextBody = (payload) => {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.mimeType?.startsWith("multipart/") && payload.parts) {
    for (const part of payload.parts) {
      const text = extractTextBody(part);
      if (text) return text;
    }
  }
  return "";
};
var findPdfAttachments = (payload) => {
  const attachments = [];
  if (!payload) return attachments;
  const isPdf = payload.mimeType === "application/pdf" || payload.mimeType === "application/octet-stream" || payload.filename && payload.filename.toLowerCase().endsWith(".pdf");
  if (isPdf && payload.body?.attachmentId) {
    attachments.push({
      filename: payload.filename || "report.pdf",
      attachmentId: payload.body.attachmentId
    });
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      attachments.push(...findPdfAttachments(part));
    }
  }
  return attachments;
};
var logMimeParts = (payload, depth = 0) => {
  if (!payload) return;
  const indent = "  ".repeat(depth);
  console.log(
    `${indent}mimeType: ${payload.mimeType}, filename: ${payload.filename || "-"}, hasAttachmentId: ${!!payload.body?.attachmentId}`
  );
  if (payload.parts) {
    for (const part of payload.parts) {
      logMimeParts(part, depth + 1);
    }
  }
};
var normalizeExtractedPdfText = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return "";
  const lineCounts = /* @__PURE__ */ new Map();
  for (const line of lines) {
    lineCounts.set(line, (lineCounts.get(line) ?? 0) + 1);
  }
  const cleanedLines = lines.filter((line) => {
    const repeated = (lineCounts.get(line) ?? 0) > 1;
    const likelyBoilerplate = /^hPod$/i.test(line) || /^Page\s+\d+\s+of\s+\d+/i.test(line) || /^This report is digitally generated$/i.test(line);
    return !(repeated && likelyBoilerplate);
  });
  return cleanedLines.join("\n").trim();
};
var extractPdfText = async (messageId, attachmentId) => {
  try {
    const { PDFParse } = await import("pdf-parse");
    const res = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId
    });
    const base64url = res.data.data;
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(base64, "base64");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText({
      lineEnforce: true,
      lineThreshold: 3.2,
      cellSeparator: " | ",
      cellThreshold: 4,
      pageJoiner: "\n-- page_number of total_number --\n"
    });
    const tableResult = await parser.getTable();
    await parser.destroy();
    const tableBlocks = [];
    for (const page of tableResult.pages) {
      for (const table of page.tables) {
        if (!table.length) continue;
        const tableText = table.map((row) => row.map((cell) => cell.trim()).join(" | ")).join("\n");
        if (tableText.trim()) {
          tableBlocks.push(`[TABLE page ${page.num}]
${tableText}`);
        }
      }
    }
    const merged = [parsed.text || "", ...tableBlocks].filter(Boolean).join("\n\n");
    const normalized = normalizeExtractedPdfText(merged);
    console.log(
      `[PDF] extracted chars=${normalized.length}, tables=${tableBlocks.length}`
    );
    return normalized;
  } catch (err) {
    console.error("Failed to extract PDF text:", err);
    return "";
  }
};
var extractPatientEmailFromPdf = (pdfText) => {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = pdfText.match(emailRegex) || [];
  const patient = matches.find(
    (email) => !email.toLowerCase().includes("hpod.in") && !email.toLowerCase().includes("healthlink")
  );
  return patient || null;
};
var fetchEmailById = async (messageId) => {
  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full"
    });
    const headers = {};
    for (const h of res.data.payload?.headers || []) {
      if (h.name && h.value) headers[h.name] = h.value;
    }
    console.log("[MIME PARTS]:");
    logMimeParts(res.data.payload);
    const bodyText = extractTextBody(res.data.payload);
    const pdfAttachments = findPdfAttachments(res.data.payload);
    const pdfTexts = [];
    let patientEmail = null;
    for (const att of pdfAttachments) {
      console.log(`Extracting PDF: ${att.filename}`);
      const text = await extractPdfText(messageId, att.attachmentId);
      if (text) {
        pdfTexts.push(`--- ${att.filename} ---
${text}`);
        if (!patientEmail) {
          patientEmail = extractPatientEmailFromPdf(text);
        }
      }
    }
    const pdfFullText = pdfTexts.join("\n\n");
    const combinedBody = [
      bodyText && `[Email Body]
${bodyText}`,
      pdfFullText && `[PDF Report]
${pdfFullText}`
    ].filter(Boolean).join("\n\n");
    return {
      gmailMessageId: messageId,
      sender: headers["From"] || "unknown",
      subject: headers["Subject"] || "(no subject)",
      body: combinedBody || "(empty)",
      pdfText: pdfFullText,
      patientEmail,
      hasPdf: pdfAttachments.length > 0
    };
  } catch (err) {
    console.error(`Failed to fetch message ${messageId}:`, err);
    return null;
  }
};
var lastHistoryId = null;
var getMessageIdsFromHistory = async (historyId) => {
  if (!lastHistoryId) {
    console.log(`[history] First call - storing ${historyId} as baseline`);
    lastHistoryId = historyId;
    return [];
  }
  const queryId = lastHistoryId;
  lastHistoryId = historyId;
  console.log(`[history] Querying since ${queryId} (current: ${historyId})`);
  try {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId: queryId,
      historyTypes: ["messageAdded"]
    });
    const messageIds = [];
    for (const record of res.data.history || []) {
      for (const added of record.messagesAdded || []) {
        if (added.message?.id) {
          messageIds.push(added.message.id);
        }
      }
    }
    return messageIds;
  } catch (err) {
    console.error("Failed to fetch history:", err);
    return [];
  }
};

// src/utils/llm.service.ts
var import_openai = __toESM(require("openai"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_zod14 = require("zod");
import_dotenv2.default.config();
var OPENAI_MODEL = process.env.HPOD_LLM_MODEL ?? "gpt-4o";
var GROK_MODEL = process.env.GROK_LLM_MODEL ?? "grok-2-latest";
var GROK_BASE_URL = process.env.GROK_BASE_URL ?? "https://api.x.ai/v1";
var GROQ_MODEL = process.env.GROQ_LLM_MODEL ?? "openai/gpt-oss-120b";
var GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
var LLM_PROVIDER = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
var MAX_PDF_TEXT_CHARS = Number(process.env.HPOD_MAX_PDF_TEXT_CHARS ?? 6e4);
var hpodSummarySchema = import_zod14.z.object({
  patientName: import_zod14.z.union([import_zod14.z.string(), import_zod14.z.null()]).transform((value) => typeof value === "string" && value.trim() ? value : "Unknown"),
  patientEmail: import_zod14.z.string().nullable(),
  patientPhone: import_zod14.z.string().nullable(),
  age: import_zod14.z.string().nullable(),
  gender: import_zod14.z.string().nullable(),
  reportDate: import_zod14.z.string().nullable(),
  vitals: import_zod14.z.object({
    weight_kg: import_zod14.z.number().nullable(),
    height_cm: import_zod14.z.number().nullable(),
    bmi: import_zod14.z.number().nullable(),
    bmi_category: import_zod14.z.string().nullable(),
    spo2_percent: import_zod14.z.number().nullable(),
    body_temperature_f: import_zod14.z.number().nullable(),
    pulse: import_zod14.z.number().nullable(),
    blood_pressure: import_zod14.z.string().nullable()
  }),
  bodyComposition: import_zod14.z.object({
    body_fat_mass_kg: import_zod14.z.number().nullable(),
    body_fat_percent: import_zod14.z.number().nullable(),
    total_body_water_L: import_zod14.z.number().nullable(),
    protein_kg: import_zod14.z.number().nullable(),
    minerals_kg: import_zod14.z.number().nullable(),
    skeletal_muscle_mass_kg: import_zod14.z.number().nullable(),
    visceral_fat_cm2: import_zod14.z.number().nullable(),
    basal_metabolic_rate_cal: import_zod14.z.number().nullable(),
    intracellular_water_L: import_zod14.z.number().nullable(),
    extracellular_water_L: import_zod14.z.number().nullable()
  }),
  ecg: import_zod14.z.object({
    pr_interval: import_zod14.z.string().nullable(),
    qrs_interval: import_zod14.z.string().nullable(),
    qtc_interval: import_zod14.z.string().nullable(),
    heart_rate: import_zod14.z.string().nullable()
  }),
  idealBodyWeight_kg: import_zod14.z.number().nullable(),
  weightToLose_kg: import_zod14.z.number().nullable(),
  testsNotTaken: import_zod14.z.array(import_zod14.z.string()),
  healthInsight: import_zod14.z.string(),
  concerns: import_zod14.z.array(import_zod14.z.string())
});
var getLlmConfig = () => {
  const grokKey = process.env.GROK_API_KEY;
  const groqKey = process.env.GROQ_API_KEY ?? grokKey;
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGrok = Boolean(grokKey);
  const hasGroq = Boolean(groqKey);
  if (LLM_PROVIDER === "grok" && groqKey?.startsWith("gsk_")) {
    const routedGroqModel = process.env.GROQ_LLM_MODEL ?? (process.env.GROK_LLM_MODEL?.startsWith("openai/") ? process.env.GROK_LLM_MODEL : GROQ_MODEL);
    console.warn(
      "LLM provider is 'grok' but key format is Groq (gsk_). Routing requests to Groq."
    );
    return {
      provider: "groq",
      client: new import_openai.default({
        apiKey: groqKey,
        baseURL: GROQ_BASE_URL
      }),
      model: routedGroqModel
    };
  }
  if (LLM_PROVIDER === "groq") {
    if (hasGroq) {
      return {
        provider: "groq",
        client: new import_openai.default({
          apiKey: groqKey,
          baseURL: GROQ_BASE_URL
        }),
        model: GROQ_MODEL
      };
    }
    if (hasOpenAI) {
      console.warn(
        "LLM provider set to groq but GROQ_API_KEY is missing; falling back to OpenAI."
      );
      return {
        provider: "openai",
        client: new import_openai.default({
          apiKey: process.env.OPENAI_API_KEY
        }),
        model: OPENAI_MODEL
      };
    }
    if (hasGrok) {
      console.warn(
        "LLM provider set to groq but GROQ_API_KEY is missing; falling back to Grok."
      );
      return {
        provider: "grok",
        client: new import_openai.default({
          apiKey: grokKey,
          baseURL: GROK_BASE_URL
        }),
        model: GROK_MODEL
      };
    }
    return null;
  }
  if (LLM_PROVIDER === "grok") {
    if (hasGrok) {
      return {
        provider: "grok",
        client: new import_openai.default({
          apiKey: grokKey,
          baseURL: GROK_BASE_URL
        }),
        model: GROK_MODEL
      };
    }
    if (hasOpenAI) {
      console.warn(
        "LLM provider set to grok but GROK_API_KEY is missing; falling back to OpenAI."
      );
      return {
        provider: "openai",
        client: new import_openai.default({
          apiKey: process.env.OPENAI_API_KEY
        }),
        model: OPENAI_MODEL
      };
    }
    return null;
  }
  if (hasOpenAI) {
    return {
      provider: "openai",
      client: new import_openai.default({
        apiKey: process.env.OPENAI_API_KEY
      }),
      model: OPENAI_MODEL
    };
  }
  if (hasGroq) {
    console.warn(
      "OPENAI_API_KEY is missing; falling back to Groq because GROQ/GROK key is set."
    );
    return {
      provider: "groq",
      client: new import_openai.default({
        apiKey: groqKey,
        baseURL: GROQ_BASE_URL
      }),
      model: GROQ_MODEL
    };
  }
  if (hasGrok) {
    console.warn(
      "OPENAI_API_KEY is missing; falling back to Grok because GROK_API_KEY is set."
    );
    return {
      provider: "grok",
      client: new import_openai.default({
        apiKey: grokKey,
        baseURL: GROK_BASE_URL
      }),
      model: GROK_MODEL
    };
  }
  return null;
};
var generateHpodSummary = async (pdfText) => {
  const llmConfig = getLlmConfig();
  if (!llmConfig) {
    console.error(
      "LLM summary error: no API key configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GROK_API_KEY."
    );
    return null;
  }
  const safePdfText = pdfText.length > MAX_PDF_TEXT_CHARS ? `${pdfText.slice(0, MAX_PDF_TEXT_CHARS)}

[TRUNCATED]` : pdfText;
  try {
    const prompt = `
You are a health data extraction assistant for a wellness platform.

Below is raw text extracted from an hPod health screening report PDF.
Extract all available health data and return it as a strict JSON object.

Rules:
- Use null for any value that says "Test Not Taken", "N/A", or is missing
- Do not guess or infer values \u2014 only extract what is explicitly stated
- For healthInsight: write 2-3 sentences summarizing the patient's overall health status based on available data
- For concerns: list any metrics that are outside normal range (e.g. low SpO2, high BMI, obesity)
- For testsNotTaken: list the names of tests that explicitly say "Test Not Taken"

Return ONLY valid JSON matching this exact structure, no markdown, no explanation:

{
  "patientName": string | null,
  "patientEmail": string | null,
  "patientPhone": string | null,
  "age": string | null,
  "gender": string | null,
  "reportDate": string | null,
  "vitals": {
    "weight_kg": number | null,
    "height_cm": number | null,
    "bmi": number | null,
    "bmi_category": string | null,
    "spo2_percent": number | null,
    "body_temperature_f": number | null,
    "pulse": number | null,
    "blood_pressure": string | null
  },
  "bodyComposition": {
    "body_fat_mass_kg": number | null,
    "body_fat_percent": number | null,
    "total_body_water_L": number | null,
    "protein_kg": number | null,
    "minerals_kg": number | null,
    "skeletal_muscle_mass_kg": number | null,
    "visceral_fat_cm2": number | null,
    "basal_metabolic_rate_cal": number | null,
    "intracellular_water_L": number | null,
    "extracellular_water_L": number | null
  },
  "ecg": {
    "pr_interval": string | null,
    "qrs_interval": string | null,
    "qtc_interval": string | null,
    "heart_rate": string | null
  },
  "idealBodyWeight_kg": number | null,
  "weightToLose_kg": number | null,
  "testsNotTaken": string[],
  "healthInsight": string,
  "concerns": string[]
}

PDF Report Text:
${safePdfText}
`;
    const response = await llmConfig.client.chat.completions.create({
      model: llmConfig.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      // low temp for factual extraction
      response_format: { type: "json_object" }
    });
    console.log(`LLM summary generated using provider: ${llmConfig.provider}`);
    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = hpodSummarySchema.safeParse(parsed);
    if (!validated.success) {
      console.error("LLM summary validation error:", validated.error.flatten());
      return null;
    }
    return validated.data;
  } catch (err) {
    console.error("LLM summary error:", err);
    return null;
  }
};

// src/models/Hpodreport.model.ts
var import_mongoose25 = __toESM(require("mongoose"), 1);
var HpodReportSchema = new import_mongoose25.Schema(
  {
    userId: {
      type: import_mongoose25.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    userEmail: {
      type: String,
      required: true
    },
    gmailMessageId: {
      type: String,
      required: true,
      unique: true
    },
    subject: {
      type: String,
      default: "(no subject)"
    },
    sender: {
      type: String,
      required: true
    },
    rawBody: {
      type: String,
      required: true
    },
    hasPdf: {
      type: Boolean,
      default: false
    },
    aiSummary: {
      type: import_mongoose25.Schema.Types.Mixed,
      default: null
    },
    summaryGeneratedAt: {
      type: Date,
      default: null
    },
    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true, collection: "hpod_reports" }
);
var HpodReport = import_mongoose25.default.models.HpodReport || import_mongoose25.default.model("HpodReport", HpodReportSchema);

// src/routes/webhook.route.ts
var router = (0, import_express14.Router)();
var ALLOWED_SENDER = "noreply@hpod.in";
var extractEmail = (sender) => {
  const match = sender.match(/<(.+?)>/);
  return match?.[1] ?? sender.trim();
};
var findUserByEmail = async (email) => {
  const db = import_mongoose26.default.connection.db;
  if (!db) return null;
  const user = await db.collection("users").findOne({ email }, { projection: { _id: 1 } });
  return user ? user._id : null;
};
router.post("/email", async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message?.data) {
      return res.status(400).json({ error: "No message data" });
    }
    const decoded = Buffer.from(message.data, "base64").toString("utf-8");
    const notification = JSON.parse(decoded);
    const historyId = notification.historyId;
    if (!historyId) {
      return res.status(200).json({ status: "no historyId" });
    }
    const messageIds = await getMessageIdsFromHistory(historyId);
    console.log(`Processing ${messageIds.length} new message(s)`);
    for (const msgId of messageIds) {
      const email = await fetchEmailById(msgId);
      if (!email) continue;
      const senderEmail = extractEmail(email.sender);
      if (senderEmail.toLowerCase() !== ALLOWED_SENDER) {
        console.log(`Skipped - not from HPOD (${senderEmail})`);
        continue;
      }
      let userId = null;
      let userEmail = "unknown";
      if (email.patientEmail) {
        userEmail = email.patientEmail;
        userId = await findUserByEmail(email.patientEmail);
        console.log(`Patient email from PDF: ${email.patientEmail} -> userId: ${userId}`);
      } else {
        console.log("No patient email found in PDF");
      }
      let aiSummary = null;
      let summaryGeneratedAt = null;
      if (email.pdfText) {
        console.log("Sending PDF to GPT for summary...");
        aiSummary = await generateHpodSummary(email.pdfText);
        summaryGeneratedAt = aiSummary ? /* @__PURE__ */ new Date() : null;
        console.log(`Summary generated: ${Boolean(aiSummary)}`);
        const gptPatientEmail = aiSummary?.patientEmail;
        if (!userId && typeof gptPatientEmail === "string" && gptPatientEmail) {
          userEmail = gptPatientEmail;
          userId = await findUserByEmail(gptPatientEmail);
          console.log(`Patient email from GPT: ${gptPatientEmail} -> userId: ${userId}`);
        }
      } else {
        console.log("No PDF text found - skipping LLM");
      }
      await HpodReport.findOneAndUpdate(
        { gmailMessageId: email.gmailMessageId },
        {
          $setOnInsert: {
            userId,
            userEmail,
            gmailMessageId: email.gmailMessageId,
            subject: email.subject,
            sender: email.sender,
            rawBody: email.body,
            hasPdf: email.hasPdf,
            aiSummary,
            summaryGeneratedAt,
            receivedAt: /* @__PURE__ */ new Date()
          }
        },
        { upsert: true, returnDocument: "after" }
      );
      console.log(`Saved HPOD report - patient: ${userEmail}, userId: ${userId}`);
    }
    return res.status(200).json({ status: "ok", processed: messageIds.length });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/reports", async (_req, res) => {
  const reports = await HpodReport.find().sort({ receivedAt: -1 }).select("-rawBody").populate("userId", "username email age gender healthGoals");
  return res.json({ reports });
});
router.get("/reports/:id", async (req, res) => {
  const report = await HpodReport.findById(req.params.id).populate(
    "userId",
    "username email age gender healthGoals"
  );
  if (!report) return res.status(404).json({ error: "Not found" });
  return res.json(report);
});
router.get("/reports/user/:userId", async (req, res) => {
  const reports = await HpodReport.find({ userId: req.params.userId }).sort({ receivedAt: -1 }).populate("userId", "username email age gender healthGoals");
  return res.json({ reports });
});
var webhook_route_default = router;

// src/app.ts
(0, import_dotenv3.config)();
var app = (0, import_express15.default)();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "false");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(import_express15.default.json());
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
    );
  });
  next();
});
app.use("/auth", auth_routes_default);
app.use("/admins", admin_routes_default);
app.use("/doctors", doctor_routes_default);
app.use("/trainers", trainer_routes_default);
app.use("/users", user_routes_default);
app.use("/memberships", membership_routes_default);
app.use("/slots", slot_routes_default);
app.use("/services", service_routes_default);
app.use("/therapies", therapy_routes_default);
app.use("/bookings", booking_routes_default);
app.use("/appointments", appointment_routes_default);
app.use("/schedules", schedule_routes_default);
app.use("/leads", lead_routes_default);
app.use("/webhook", webhook_route_default);
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});
var app_default = app;

// src/utils/db.ts
var import_mongoose27 = __toESM(require("mongoose"), 1);
var connectionPromise = null;
async function connectDB() {
  const connectionUrl = process.env.MONGODB_URL;
  if (!connectionUrl) {
    throw new Error("Empty connection string for MongoDB connection");
  }
  if (import_mongoose27.default.connection.readyState === 1) {
    return;
  }
  if (!connectionPromise) {
    connectionPromise = import_mongoose27.default.connect(connectionUrl, {
      serverSelectionTimeoutMS: 5e3
    });
  }
  try {
    await connectionPromise;
    console.log("\u2705 MongoDB connected");
  } catch (error) {
    connectionPromise = null;
    console.error("\u274C MongoDB connection error:", error);
    throw error;
  } finally {
    connectionPromise = null;
  }
}

// api/index.ts
var dbReadyPromise = null;
var ensureDbConnection = async () => {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB();
  }
  try {
    await dbReadyPromise;
  } catch (error) {
    dbReadyPromise = null;
    throw error;
  }
};
async function handler(req, res) {
  try {
    await ensureDbConnection();
    return app_default(req, res);
  } catch (error) {
    console.error("Request initialization failed:", error);
    res.status(500).json({ message: "Server initialization failed" });
  }
}
