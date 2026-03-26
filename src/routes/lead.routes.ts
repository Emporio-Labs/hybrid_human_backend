import { Router } from "express";
import {
  convertLeadToUser,
  createLead,
  deleteLeadById,
  getAllLeads,
  getLeadById,
  updateLeadById,
} from "../controllers/lead.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const leadRouter = Router();

leadRouter.use(authenticateBasicCredentials);

leadRouter.post("/", authorize(["admin", "doctor", "trainer"]), createLead);
leadRouter.get("/", authorize(["admin"]), getAllLeads);
leadRouter.get("/:id", authorize(["admin", "doctor", "trainer"]), getLeadById);
leadRouter.patch("/:id", authorize(["admin", "doctor", "trainer"]), updateLeadById);
leadRouter.delete("/:id", authorize(["admin"]), deleteLeadById);
leadRouter.post(
  "/:id/convert",
  authorize(["admin"]),
  convertLeadToUser,
);

export default leadRouter;
