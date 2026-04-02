import { z } from "zod";
// YEH SIGNUP FORM KE LIYE VALIDATION SCHEMA HAI ////
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long"),

  email: z.string().email("Invalid email address").toLowerCase(),

  age: z
    .coerce.number() // Coerce string to number (handles form data)
    .min(18, "You must be at least 18 years old")
    .max(100, "Please enter a valid age"),

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
export type RegisterInput = z.infer<typeof registerSchema>;