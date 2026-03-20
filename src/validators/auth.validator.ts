import z from "zod";

export const signupBodySchema = z.object({
  username: z.string().min(1),
  phone: z.string().min(1),
  email: z.email(),
  age: z.string().min(1),
  gender: z.string().min(1),
  healthGoals: z.array(z.string().min(1)).default([]),
  password: z.string().min(6),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
