import{z} from "zod";
// YEH LOGIN FORM KE LIYE VALIDATION SCHEMA HAI ////
export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .toLowerCase(),
password:z
    .string()
    .min(1, "Password is Required "),
});
export type LoginInput = z.infer<typeof loginSchema>;
