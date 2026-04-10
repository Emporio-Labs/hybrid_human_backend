import { Router } from "express";
import {
	createUser,
	deleteUserById,
	getAllUsers,
	getMyUser,
	getUserById,
	onboardUser,
	updateUserById,
} from "../controllers/user.controller";
import { authenticateBasicCredentials } from "../middleware/basic-auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const userRouter = Router();

userRouter.use(authenticateBasicCredentials);
userRouter.post("/", authorize(["admin"]), createUser);
userRouter.get("/", authorize(["admin", "doctor"]), getAllUsers);
userRouter.get("/me", authorize(["user"]), getMyUser);
userRouter.get("/:id", authorize(["admin", "doctor"]), getUserById);
userRouter.patch(
	"/:id/onboard",
	authorize(["admin", "user"]),
	onboardUser,
);
userRouter.patch("/:id", authorize(["admin"]), updateUserById);
userRouter.delete("/:id", authorize(["admin"]), deleteUserById);

export default userRouter;
