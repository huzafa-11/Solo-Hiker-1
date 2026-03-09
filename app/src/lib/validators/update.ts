import{z} from "zod"; 
export const updateProfileSchema = z.object({
  cnic: z
    .string()
    .min(11, "CNIC must be at least 11 characters")
    .optional(),

  hikingLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;   