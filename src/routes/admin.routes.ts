import { Router } from "express";
import {
	createAdmin,
	deleteAdminById,
	getAdminById,
	getAllAdmins,
	updateAdminById,
} from "../controllers/admin.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const adminRouter = Router();

adminRouter.use(authenticateBasicCredentials);
adminRouter.post("/", authorize(["admin"]), createAdmin);
adminRouter.get("/", authorize(["admin"]), getAllAdmins);
adminRouter.get("/:id", authorize(["admin"]), getAdminById);
adminRouter.patch("/:id", authorize(["admin"]), updateAdminById);
adminRouter.delete("/:id", authorize(["admin"]), deleteAdminById);

export default adminRouter;
