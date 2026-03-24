import { Router } from "express";
import {
	createPlan,
	deletePlanById,
	getAllPlans,
	getPlanById,
	updatePlanById,
} from "../controllers/plan.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const planRouter = Router();

planRouter.use(authenticateBasicCredentials);
planRouter.use(authorize(["admin"]));

planRouter.post("/", createPlan);
planRouter.get("/", getAllPlans);
planRouter.get("/:id", getPlanById);
planRouter.patch("/:id", updatePlanById);
planRouter.delete("/:id", deletePlanById);

export default planRouter;
