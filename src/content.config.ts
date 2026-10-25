import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';
import { gameIds } from './lib/registry.mjs';

// A page's engine and system come from where it lives (engines/<engine>/<system>/...), never from frontmatter, so
// they can't disagree. What a page adds: the games it covers (default: every game of its engine), the outside
// sources it draws on, and where a tool implements what it describes (tracked, shown small, not the point).
const game = z.enum(gameIds as [string, ...string[]]);

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        games: z.array(game).optional(),
        sources: z
          .array(
            z.object({
              title: z.string(),
              url: z.url().optional(),
              note: z.string().optional(),
            }),
          )
          .default([]),
        implementations: z
          .array(
            z.object({
              name: z.string(),
              url: z.url().optional(),
              note: z.string().optional(),
            }),
          )
          .default([]),
      }),
    }),
  }),
};
