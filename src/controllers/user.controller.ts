import type { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import { hashPassword } from "../utils/password";
import {
	createUserBodySchema,
	updateUserBodySchema,
} from "../validators/user.validator";

const canOnboard = (requester: Express.Request["user"], targetUserId: string) => {
	if (!requester) return false;
	if (requester.role === "admin") return true;
	return requester.role === "user" && requester.id === targetUserId;
};

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createUser: RequestHandler = async (req, res, next) => {
	const parsedBody = createUserBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid user payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { password, onboarded = false, ...rest } = parsedBody.data;

	try {
		const passwordHash = await hashPassword(password);

		const existingUser = await User.findOne({
			email: parsedBody.data.email,
		}).select("_id");

		if (existingUser) {
			res.status(409).json({ message: "User with this email already exists" });
			return;
		}

		const user = await User.create({
			...rest,
			onboarded,
			passwordHash,
		});

		res.status(201).json({ message: "User created", user });
	} catch (error) {
		next(error);
	}
};

export const getAllUsers: RequestHandler = async (_req, res, next) => {
	try {
		const users = await User.find();
		res.status(200).json({ users });
	} catch (error) {
		next(error);
	}
};

export const getMyUser: RequestHandler = async (req, res, next) => {
	if (!req.user || req.user.role !== "user") {
		res.status(403).json({ message: "Only users can access this endpoint" });
		return;
	}

	try {
		const user = await User.findById(req.user.id);

		if (!user) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const getUserById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	try {
		const user = await User.findById(id);

		if (!user) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const updateUserById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	const parsedBody = updateUserBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid user update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { password, ...rest } = parsedBody.data;
	const hashedPassword = password ? await hashPassword(password) : null;
	const updatePayload = {
		...rest,
		...(hashedPassword ? { passwordHash: hashedPassword } : {}),
	};

	try {
		const updatedUser = await User.findByIdAndUpdate(id, updatePayload, {
			returnDocument: "after",
			runValidators: true,
		});

		if (!updatedUser) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ message: "User updated", user: updatedUser });
	} catch (error) {
		next(error);
	}
};

export const deleteUserById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	try {
		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ message: "User deleted" });
	} catch (error) {
		next(error);
	}
};

// Allow a user to mark themselves onboarded (or admin to onboard any user)
export const onboardUser: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	if (!req.user || !canOnboard(req.user, id)) {
		res.status(403).json({ message: "Forbidden" });
		return;
	}

	const parsedBody = updateUserBodySchema.safeParse({
		...req.body,
		onboarded: true,
	});

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid onboarding payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { password, ...rest } = parsedBody.data;
	const hashedPassword = password ? await hashPassword(password) : null;
	const updatePayload = {
		...rest,
		...(hashedPassword ? { passwordHash: hashedPassword } : {}),
	};

	try {
		const updatedUser = await User.findByIdAndUpdate(id, updatePayload, {
			returnDocument: "after",
			runValidators: true,
		});

		if (!updatedUser) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({
			message: "User onboarded",
			user: updatedUser,
		});
	} catch (error) {
		next(error);
	}
};
