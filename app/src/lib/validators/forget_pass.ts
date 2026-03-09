import {z} from "zod";
// YEH FORGET PASSWORD FORM KE LIYE VALIDATION SCHEMA HAI ////
export const forgetPassSchema = z.object({
  email: z
   .email("Invalid email address")
   .toLowerCase(),
});
export type ForgetPassInput = z.infer<typeof forgetPassSchema>; 