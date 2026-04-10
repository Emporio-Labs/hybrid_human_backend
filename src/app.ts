import { config } from "dotenv";
import express from "express";
import adminRouter from "./routes/admin.routes";
import appointmentRouter from "./routes/appointment.routes";
import authRouter from "./routes/auth.routes";
import bookingRouter from "./routes/booking.routes";
import doctorRouter from "./routes/doctor.routes";
import leadRouter from "./routes/lead.routes";
import membershipRouter from "./routes/membership.routes";
import scheduleRouter from "./routes/schedule.routes";
import serviceRouter from "./routes/service.routes";
import slotRouter from "./routes/slot.routes";
import therapyRouter from "./routes/therapy.routes";
import trainerRouter from "./routes/trainer.routes";
import userRouter from "./routes/user.routes";
import webhookRouter from "./routes/webhook.route";

config();

const app = express();

app.use((req, res, next) => {
	// TODO: Temporary MVP setting. Lock this down to specific frontend origins before production hardening.
	res.setHeader("Access-Control-Allow-Origin", "*");

	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET,POST,PUT,PATCH,DELETE,OPTIONS",
	);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Access-Control-Allow-Credentials", "false");

	if (req.method === "OPTIONS") {
		res.sendStatus(204);
		return;
	}

	next();
});

app.use(express.json());
app.use((req, res, next) => {
	const start = Date.now();

	console.log(`[REQ] ${req.method} ${req.originalUrl}`);

	res.on("finish", () => {
		const durationMs = Date.now() - start;
		console.log(
			`[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
		);
	});

	next();
});

app.use("/auth", authRouter);
app.use("/admins", adminRouter);
app.use("/doctors", doctorRouter);
app.use("/trainers", trainerRouter);
app.use("/users", userRouter);
app.use("/memberships", membershipRouter);
app.use("/slots", slotRouter);
app.use("/services", serviceRouter);
app.use("/therapies", therapyRouter);
app.use("/bookings", bookingRouter);
app.use("/appointments", appointmentRouter);
app.use("/schedules", scheduleRouter);
app.use("/leads", leadRouter);
app.use("/webhook", webhookRouter);

app.get("/health", (_req, res) => {
	res.status(200).json({ ok: true });
});

export default app;