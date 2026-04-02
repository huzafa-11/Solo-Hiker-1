import { z } from 'zod';

// ============================================
// CREATE HIKE VALIDATION SCHEMA
// ============================================
// This schema validates all the fields when creating a new trip
// It's used both on the frontend (react-hook-form) and backend (API route)

export const createTripSchema = z.object({
  // TRIP NAME
  // Must be between 5-100 characters
  tripName: z
    .string()
    .min(5, 'Trip name must be at least 5 characters')
    .max(100, 'Trip name cannot exceed 100 characters')
    .trim(),

  // DESCRIPTION
  // Must be detailed (20-1000 characters)
  description: z
    .string()
    .min(20, 'Please provide a detailed description (minimum 20 characters)')
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim(),

  // LOCATION
  // Where is the trip happening?
  location: z
    .string()
    .min(3, 'Location is required (minimum 3 characters)')
    .max(200, 'Location cannot exceed 200 characters')
    .trim(),

  // START DATE
  // Must be in the future
  startDate: z
    .string()
    .refine(
      (date) => {
        const tripDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight
        return tripDate >= today;
      },
      {
        message: 'Start date must be today or in the future',
      }
    ),

  // END DATE
  // Must be after start date
  endDate: z.string(),


  // DIFFICULTY
  // EASY, MODERATE, HARD, EXPERT
  difficulty: z
    .enum(['EASY', 'MODERATE', 'HARD', 'EXPERT'])
    .default('MODERATE'),

  // MAX PARTICIPANTS
  // Minimum 2 (you + 1 other), Maximum 50
  maxParticipants: z
    .number()
    .min(2, 'Minimum 2 participants required')
    .max(50, 'Maximum 50 participants allowed'),

  // IMAGES
  // Array of base64 strings (1-5 images)
  images: z
    .array(z.string())
    .min(1, 'Please upload at least one image')
    .max(5, 'Maximum 5 images allowed'),

  // PRIVACY
  // True = Public (everyone can see)
  // False = Private (only you can see)
  isPublic: z.boolean().default(true),
})
.refine(
  (data) => {
    // Additional validation: endDate must be after startDate
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'], // Show error on endDate field
  }
);

// ============================================
// TYPESCRIPT TYPE
// ============================================
// This creates a TypeScript type from the Zod schema
// Use this type in your components for type safety

export type CreateTripInput = z.infer<typeof createTripSchema>;

// ============================================
// DIFFICULTY OPTIONS
// ============================================
// Use this array for the dropdown in your form

export const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: '🌱 Easy - Beginner friendly', description: 'Suitable for beginners with basic fitness' },
  { value: 'MODERATE', label: '⛰️ Moderate - Some experience', description: 'Requires moderate fitness and some hiking experience' },
  { value: 'HARD', label: '🏔️ Hard - Experienced hikers', description: 'Challenging trails, requires good fitness and experience' },
  { value: 'EXPERT', label: '🔥 Expert - Advanced only', description: 'Only for highly experienced mountaineers' },
] as const;

/*
===========================================
EXAMPLE USAGE IN REACT-HOOK-FORM:
===========================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTripSchema, CreateTripInput } from '@/lib/validators/trip';

const CreateTripForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema), // ← Validates using Zod schema
  });

  const onSubmit = async (data: CreateTripInput) => {
    // data is fully typed and validated!
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('tripName')} />
      {errors.tripName && <p>{errors.tripName.message}</p>}
    </form>
  );
};

===========================================
EXAMPLE USAGE IN API ROUTE:
===========================================

import { createTripSchema } from '@/lib/validators/trip';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate the data
  const result = createTripSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { success: false, errors: result.error.errors },
      { status: 400 }
    );
  }
  
  // result.data is fully validated and typed!
  const tripData = result.data;
}

===========================================
*/