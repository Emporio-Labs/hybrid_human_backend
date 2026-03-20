export type AppUserRole = "user" | "admin" | "doctor" | "trainer";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: AppUserRole;
};
