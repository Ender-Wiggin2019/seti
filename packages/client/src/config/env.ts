import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_WS_URL: z.string().url(),
  VITE_ENABLE_DEBUG_ROUTES: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
});

export type TClientEnv = z.infer<typeof envSchema>;

export const CLIENT_ENV: TClientEnv = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_ENABLE_DEBUG_ROUTES: import.meta.env.VITE_ENABLE_DEBUG_ROUTES,
});
