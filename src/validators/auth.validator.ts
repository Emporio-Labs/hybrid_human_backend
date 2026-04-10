import z from "zod";
import { Gender } from "../models/Enums";

const genderValues = Object.values(Gender).map(String) as [string, ...string[]];

const signupAgeSchema = z.preprocess((value) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	if (typeof value === "string") {
		return value.trim();
	}

	return value;
}, z.string().min(1));

const signupGenderSchema = z.preprocess((value) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	if (typeof value === "string") {
		const normalized = value.trim();
		if (normalized.toLowerCase() === "other") {
			return "Others";
		}

		return normalized;
	}

	return value;
}, z.enum(genderValues));

export const signupBodySchema = z.object({
	username: z.string().trim().min(1),
	phone: z.string().trim().min(1),
	email: z.string().email(),
	age: signupAgeSchema,
	gender: signupGenderSchema,
	healthGoals: z.array(z.string().trim().min(1)).default([]),
	password: z.string().min(6),
});

export const loginBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
