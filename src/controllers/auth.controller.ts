import type { RequestHandler } from "express";
import Admin from "../models/Admin";
import User from "../models/User";
import {
	loginBodySchema,
	signupBodySchema,
} from "../validators/auth.validator";

export const signup: RequestHandler = async (req, res, next) => {
	const parsedBody = signupBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid signup data",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { username, phone, email, age, gender, healthGoals, password } =
		parsedBody.data;

	try {
		const existingUser = await User.findOne({ email }).select("_id");

		if (existingUser) {
			res.status(409).json({ message: "User with this email already exists" });
			return;
		}

		const createdUser = await User.create({
			username,
			phone,
			email,
			age,
			gender,
			healthGoals,
			passwordHash: password,
		});

		res.status(201).json({
			message: "User signup successful",
			userId: createdUser._id,
		});
	} catch (error) {
		next(error);
	}
};

export const login: RequestHandler = async (req, res, next) => {
	console.log("[AUTH][LOGIN] Request received", {
		path: req.originalUrl,
		method: req.method,
		hasBody: Boolean(req.body),
	});

	const parsedBody = loginBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		console.log("[AUTH][LOGIN] Validation failed", {
			errors: parsedBody.error.issues,
		});

		res.status(400).json({
			message: "Invalid login data",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { email, password } = parsedBody.data;

	try {
		console.log("[AUTH][LOGIN] Looking up user/admin", { email });

		const [user, admin] = await Promise.all([
			User.findOne({ email }),
			Admin.findOne({ email }),
		]);

		const matchedAccount =
			user && user.passwordHash === password
				? {
						id: user._id.toString(),
						email: user.email,
						role: "user" as const,
					}
				: admin && admin.passwordHash === password
					? {
							id: admin._id.toString(),
							email: admin.email,
							role: "admin" as const,
						}
					: null;

		if (!matchedAccount) {
			console.log("[AUTH][LOGIN] Invalid credentials", {
				email,
				userFound: Boolean(user),
				adminFound: Boolean(admin),
			});

			res.status(401).json({ message: "Invalid email or password" });
			return;
		}

		req.user = matchedAccount;

		console.log("[AUTH][LOGIN] Login successful", {
			email,
			userId: req.user.id,
			role: req.user.role,
		});

		res.status(200).json({
			message: "Login successful",
			user: req.user,
		});
	} catch (error) {
		console.error("[AUTH][LOGIN] Unexpected error", error);
		next(error);
	}
};
