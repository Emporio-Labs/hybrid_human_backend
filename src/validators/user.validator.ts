import z from "zod";
import { Gender } from "../models/Enums";

const genderValues = Object.values(Gender).map(String) as [string, ...string[]];

const requiredString = z.string().trim().min(1);

const requiredAgeString = z.preprocess((value) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	if (typeof value === "string") {
		return value.trim();
	}

	return value;
}, z.string().min(1));

const requiredGenderString = z.preprocess((value) => {
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

const optionalString = z.preprocess((value) => {
	if (typeof value === "string" && value.trim() === "") {
		return undefined;
	}

	return value;
}, z.string().trim().min(1).optional());

const optionalAgeString = z.preprocess((value) => {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === "string" && value.trim() === "") {
		return undefined;
	}

	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	if (typeof value === "string") {
		return value.trim();
	}

	return value;
}, z.string().min(1).optional());

const optionalGenderString = z.preprocess((value) => {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === "string" && value.trim() === "") {
		return undefined;
	}

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
}, z.enum(genderValues).optional());

export const createUserBodySchema = z.object({
	username: requiredString,
	phone: requiredString,
	email: z.string().email(),
	age: requiredAgeString,
	gender: requiredGenderString,
	healthGoals: z.array(z.string().trim().min(1)).default([]),
	password: z.string().min(6),
	onboarded: z.boolean().optional().default(false),
});

export const updateUserBodySchema = z
	.object({
		username: optionalString,
		phone: optionalString,
		email: z.preprocess((value) => {
			if (typeof value === "string" && value.trim() === "") {
				return undefined;
			}

			return value;
		}, z.string().email().optional()),
		age: optionalAgeString,
		gender: optionalGenderString,
		healthGoals: z.array(z.string().trim().min(1)).optional(),
		password: z.string().min(6).optional(),
		onboarded: z.boolean().optional(),
	})
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
