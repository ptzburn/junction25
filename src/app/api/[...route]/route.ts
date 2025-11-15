import { Hono } from "hono";
import { handle } from "hono/vercel";

import notFound from "../_middlewares/not-found-middleware";
import onError from "../_middlewares/on-error-middleware";
import { ordersRoute } from "../_routes/orders";

const app = new Hono().basePath("/api").onError(onError).notFound(notFound);

const routes = [
  ordersRoute,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export const GET = handle(app);
export const POST = handle(app);
