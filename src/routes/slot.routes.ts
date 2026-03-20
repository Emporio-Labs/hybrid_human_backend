import { Router } from "express";
import {
	createSlot,
	deleteSlotById,
	getAllSlots,
	getSlotById,
	updateSlotById,
} from "../controllers/slot.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const slotRouter = Router();

slotRouter.use(authenticateBasicCredentials);
slotRouter.use(authorize(["admin"]));

slotRouter.post("/", createSlot);
slotRouter.get("/", getAllSlots);
slotRouter.get("/:id", getSlotById);
slotRouter.patch("/:id", updateSlotById);
slotRouter.delete("/:id", deleteSlotById);

export default slotRouter;
