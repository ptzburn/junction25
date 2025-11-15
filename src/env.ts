import type { StandardSchemaV1 } from "@t3-oss/env-core";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  server: {
    NODE_ENV: z.enum(["development", "testing", "production"]).default("development"),
    GEMINI_API_KEY: z.string(),
    GEMINI_URL: z.url(),
    GOOGLE_SERVICE_ACCOUNT_KEY: z.string(),
  },
  experimental__runtimeEnv: {
    /* eslint-disable node/no-process-env */
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  onValidationError: (issues: readonly StandardSchemaV1.Issue[]) => {
    console.error(
      "❌ Invalid environment variables:",
      issues,
    );
    process.exit(1);
  },
});

export default env;
