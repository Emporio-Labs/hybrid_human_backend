import z from "zod";
import { CreditTransactionSource } from "../models/Enums";

export const topUpCreditsBodySchema = z.object({
	membershipId: z.string().trim().min(1).optional(),
	amount: z.coerce.number().positive(),
	reason: z.string().trim().min(1).optional(),
});

export const creditHistoryQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(200).optional().default(50),
	sourceType: z
		.enum(Object.values(CreditTransactionSource) as [string, ...string[]])
		.optional(),
});

export type TopUpCreditsBody = z.infer<typeof topUpCreditsBodySchema>;
export type CreditHistoryQuery = z.infer<typeof creditHistoryQuerySchema>;
