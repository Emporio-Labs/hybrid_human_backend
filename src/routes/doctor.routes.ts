import { Router } from "express";
import {
	createDoctor,
	deleteDoctorById,
	getAllDoctors,
	getDoctorById,
	updateDoctorById,
} from "../controllers/doctor.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const doctorRouter = Router();

doctorRouter.use(authenticateBasicCredentials);
doctorRouter.post("/", authorize(["admin"]), createDoctor);
doctorRouter.get("/", authorize(["admin"]), getAllDoctors);
doctorRouter.get("/:id", authorize(["doctor", "trainer"]), getDoctorById);
doctorRouter.patch("/:id", authorize(["doctor", "trainer"]), updateDoctorById);
doctorRouter.delete("/:id", authorize(["admin"]), deleteDoctorById);

export default doctorRouter;
