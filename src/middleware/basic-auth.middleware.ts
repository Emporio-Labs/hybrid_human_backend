import type { RequestHandler } from "express";
import Admin from "../models/Admin";
import Doctor from "../models/Doctor";
import Trainer from "../models/Trainer";
import User from "../models/User";

const getCredentialsFromHeader = (
	authorization: string | undefined,
): { email: string; password: string } | null => {
	if (!authorization) {
		return null;
	}

	const [scheme, encodedCredentials] = authorization.split(" ");

	if (scheme !== "Basic" || !encodedCredentials) {
		return null;
	}

	const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
		"utf8",
	);
	const separatorIndex = decodedCredentials.indexOf(":");

	if (separatorIndex === -1) {
		return null;
	}

	const email = decodedCredentials.slice(0, separatorIndex).trim();
	const password = decodedCredentials.slice(separatorIndex + 1);

	if (!email || !password) {
		return null;
	}

	return { email, password };
};

export const authenticateBasicCredentials: RequestHandler = async (
	req,
	res,
	next,
) => {
	const credentials = getCredentialsFromHeader(req.header("authorization"));

	if (!credentials) {
		res
			.status(401)
			.json({ message: "Missing or invalid Authorization header" });
		return;
	}

	const { email, password } = credentials;

	try {
		const [admin, doctor, trainer, user] = await Promise.all([
			Admin.findOne({ email, passwordHash: password }).select("_id email"),
			Doctor.findOne({ email, passwordHash: password }).select("_id email"),
			Trainer.findOne({ email, passwordHash: password }).select("_id email"),
			User.findOne({ email, passwordHash: password }).select("_id email"),
		]);

		if (admin) {
			req.user = {
				id: admin._id.toString(),
				email: admin.email,
				role: "admin",
			};
			next();
			return;
		}

		if (doctor) {
			req.user = {
				id: doctor._id.toString(),
				email: doctor.email,
				role: "doctor",
			};
			next();
			return;
		}

		if (trainer) {
			req.user = {
				id: trainer._id.toString(),
				email: trainer.email,
				role: "trainer",
			};
			next();
			return;
		}

		if (user) {
			req.user = {
				id: user._id.toString(),
				email: user.email,
				role: "user",
			};
			next();
			return;
		}

		res.status(401).json({ message: "Invalid email or password" });
	} catch (error) {
		next(error);
	}
};
