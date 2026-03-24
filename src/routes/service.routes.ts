import { Router } from "express";
import {
	createService,
	deleteServiceById,
	getAllServices,
	getServiceById,
	updateServiceById,
} from "../controllers/service.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const serviceRouter = Router();

serviceRouter.use(authenticateBasicCredentials);

serviceRouter.post("/", authorize(["admin"]), createService);
serviceRouter.get("/", getAllServices);
serviceRouter.get("/:id", getServiceById);
serviceRouter.patch("/:id", authorize(["admin"]), updateServiceById);
serviceRouter.delete("/:id", authorize(["admin"]), deleteServiceById);

export default serviceRouter;
