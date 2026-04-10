import z from "zod";
import { Gender, LeadStatus } from "../models/Enums";

const leadStatusValues = Object.values(LeadStatus) as [string, ...string[]];
const genderValues = Object.values(Gender).map(String);

export const createLeadBodySchema = z.object({
  leadName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).optional(),
  interestedIn: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  followUpDate: z.string().trim().min(1).optional(),
  ownerId: z.string().trim().min(1).optional(),
  status: z.enum(leadStatusValues).optional(),
});

export const updateLeadBodySchema = createLeadBodySchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const convertLeadBodySchema = z.object({
  username: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1),
  age: z.string().trim().min(1),
  gender: z.enum(genderValues as [string, ...string[]]),
  healthGoals: z.array(z.string().trim().min(1)).default([]),
  password: z.string().min(1),
});

export type CreateLeadBody = z.infer<typeof createLeadBodySchema>;
export type UpdateLeadBody = z.infer<typeof updateLeadBodySchema>;
export type ConvertLeadBody = z.infer<typeof convertLeadBodySchema>;
