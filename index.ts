import { config } from "dotenv";
import express from "express";
import adminRouter from "./src/routes/admin.routes";
import appointmentRouter from "./src/routes/appointment.routes";
import authRouter from "./src/routes/auth.routes";
import bookingRouter from "./src/routes/booking.routes";
import doctorRouter from "./src/routes/doctor.routes";
import membershipRouter from "./src/routes/membership.routes";
import scheduleRouter from "./src/routes/schedule.routes";
import slotRouter from "./src/routes/slot.routes";
import serviceRouter from "./src/routes/service.routes";
import trainerRouter from "./src/routes/trainer.routes";
import therapyRouter from "./src/routes/therapy.routes";
import userRouter from "./src/routes/user.routes";
import leadRouter from "./src/routes/lead.routes";
import connectDB from "./src/utils/db";

const app = express();
config();

const allowedOrigins = new Set([
	process.env.CLIENT_URL ?? "http://localhost:3001",
]);

app.use((req, res, next) => {
	const origin = req.headers.origin;

	if (origin && allowedOrigins.has(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Vary", "Origin");
	}

	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET,POST,PUT,PATCH,DELETE,OPTIONS",
	);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Access-Control-Allow-Credentials", "true");

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

app.get("/health", (_req, res) => {
	res.status(200).json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);

await connectDB();
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
