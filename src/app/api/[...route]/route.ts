import { Hono } from "hono";
import { handle } from "hono/vercel";

import notFound from "../_middlewares/not-found-middleware";
import onError from "../_middlewares/on-error-middleware";
import { dishesRoute } from "../_routes/dishes";
import { ordersRoute } from "../_routes/orders";
import { restaurantsRoute } from "../_routes/restaurants";
import { stockRoute } from "../_routes/stock";
import { calendarRoute } from "../_routes/calendar";
import { suggestionsRoute } from "../_routes/suggestions";

const app = new Hono().basePath("/api").onError(onError).notFound(notFound);

const routes = [
  ordersRoute,
  stockRoute,
  dishesRoute,
  restaurantsRoute,
  calendarRoute,
  suggestionsRoute,
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export const GET = handle(app);
export const POST = handle(app);
