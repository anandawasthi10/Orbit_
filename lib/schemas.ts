import { z } from 'zod';

/**
 * Task submission validation schema for team members
 */
export const taskSubmissionSchema = z.object({
  link: z
    .string()
    .min(1, 'Submission link URL is required')
    .refine(
      (val) => /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/.*)?$/i.test(val.trim()),
      {
        message: 'Please enter a valid URL (e.g. https://github.com/... or https://mydemo.vercel.app)',
      }
    ),
  note: z.string().default(''),
  attachmentUrl: z.string().default(''),
});

export type TaskSubmissionFormValues = z.infer<typeof taskSubmissionSchema>;
