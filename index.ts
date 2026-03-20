import express from "express";
import authRouter from "./src/routes/auth.routes";
import { config } from "dotenv";
import connectDB from "./src/utils/db";

const app = express();
config();

app.use(express.json());
app.use("/auth", authRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);

await connectDB();
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
