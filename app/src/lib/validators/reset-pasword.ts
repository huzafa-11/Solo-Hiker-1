import{z} from "zod";
// yeh reset pass k liye ha 
export const resetPassSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
     .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Error shows on confirmPassword field
});
export type ResetPassInput = z.infer<typeof resetPassSchema>;