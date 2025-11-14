import type { NotFoundHandler } from "hono";

const notFound: NotFoundHandler = (c) => {
  return c.json({
    success: false,
    message: `Not found - ${c.req.path}`,
  }, 404);
};

export default notFound;
