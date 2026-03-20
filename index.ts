import { config } from "dotenv";
import express from "express";
import adminRouter from "./src/routes/admin.routes";
import appointmentRouter from "./src/routes/appointment.routes";
import authRouter from "./src/routes/auth.routes";
import bookingRouter from "./src/routes/booking.routes";
import doctorRouter from "./src/routes/doctor.routes";
import slotRouter from "./src/routes/slot.routes";
import trainerRouter from "./src/routes/trainer.routes";
import connectDB from "./src/utils/db";

const app = express();
config();

app.use(express.json());
app.use("/auth", authRouter);
app.use("/admins", adminRouter);
app.use("/doctors", doctorRouter);
app.use("/trainers", trainerRouter);
app.use("/slots", slotRouter);
app.use("/bookings", bookingRouter);
app.use("/appointments", appointmentRouter);

app.get("/health", (_req, res) => {
	res.status(200).json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);

await connectDB();
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
