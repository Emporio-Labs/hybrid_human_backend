import { Router } from "express";
import {
	createTherapy,
	deleteTherapyById,
	getAllTherapies,
	getTherapyById,
	updateTherapyById,
} from "../controllers/therapy.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const therapyRouter = Router();

therapyRouter.use(authenticateBasicCredentials);
therapyRouter.get(
	"/",
	authorize(["admin", "doctor", "trainer", "user"]),
	getAllTherapies,
);
therapyRouter.get(
	"/:id",
	authorize(["admin", "doctor", "trainer", "user"]),
	getTherapyById,
);
therapyRouter.post("/", authorize(["admin"]), createTherapy);
therapyRouter.patch("/:id", authorize(["admin"]), updateTherapyById);
therapyRouter.delete("/:id", authorize(["admin"]), deleteTherapyById);

export default therapyRouter;
