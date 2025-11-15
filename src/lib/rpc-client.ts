import { hc } from "hono/client";

import type { AppType } from "@/app/api/[...route]/route";

import env from "@/env";

// This is a trick to calculate the type when compiling
export type Client = ReturnType<typeof hc<AppType>>;

export function hcWithType(...args: Parameters<typeof hc>): Client {
  return hc<AppType>(...args);
}

export const routesClient = hcWithType(`${env.NEXT_PUBLIC_APP_URL}/api`, {
  init: {
    credentials: "include",
  },
});
