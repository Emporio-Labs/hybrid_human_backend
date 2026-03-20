import { Router } from "express";
import {
	createTrainer,
	deleteTrainerById,
	getAllTrainers,
	getTrainerById,
	updateTrainerById,
} from "../controllers/trainer.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const trainerRouter = Router();

trainerRouter.use(authenticateBasicCredentials);
trainerRouter.post("/", authorize(["admin"]), createTrainer);
trainerRouter.get("/", authorize(["admin"]), getAllTrainers);
trainerRouter.get("/:id", authorize(["trainer", "doctor"]), getTrainerById);
trainerRouter.patch(
	"/:id",
	authorize(["trainer", "doctor"]),
	updateTrainerById,
);
trainerRouter.delete("/:id", authorize(["admin"]), deleteTrainerById);

export default trainerRouter;
