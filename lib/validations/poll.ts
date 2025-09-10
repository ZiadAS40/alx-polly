import { z } from 'zod';

export const createPollSchema = z.object({
  question: z.string()
    .min(1, 'Question is required')
    .max(500, 'Question is too long')
    .regex(/^[a-zA-Z0-9\s\?\!\.\,\-]+$/, 'Question contains invalid characters'),
  options: z.array(z.string())
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(
      (options) => options.every(option => 
        option.length >= 1 && option.length <= 200
      ),
      'Each option must be between 1 and 200 characters'
    )
    .refine(
      (options) => new Set(options).size === options.length,
      'Options must be unique'
    ),
  expiresAt: z.string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const expirationDate = new Date(date);
        const now = new Date();
        return expirationDate > now;
      },
      'Expiration date must be in the future'
    ),
});

export const voteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionIndex: z.number()
    .int('Option index must be an integer')
    .min(0, 'Invalid option index')
    .max(9, 'Invalid option index'),
});

export const updatePollSchema = createPollSchema.extend({
  pollId: z.string().uuid('Invalid poll ID'),
});

export type CreatePollFormData = z.infer<typeof createPollSchema>;
export type VoteFormData = z.infer<typeof voteSchema>;
export type UpdatePollFormData = z.infer<typeof updatePollSchema>;
