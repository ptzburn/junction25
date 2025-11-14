import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { HTTPException } from "hono/http-exception";

import env from "@/env";

const onError: ErrorHandler = (error, c) => {
  const currentStatus = "status" in error ? error.status : c.newResponse(null).status;
  const statusCode = currentStatus !== 200
    ? (currentStatus as ContentfulStatusCode)
    : 500;
  const environment = env.NODE_ENV;

  if (error instanceof HTTPException) {
    c.var.logger.error("HTTPException: ", error);
    if (error.status === 422) {
      return c.json({
        success: false,
        errors: [{
          message: error.message,
        }],
        stack: environment === "production" ? undefined : error.stack,
      }, error.status);
    }
    return c.json({
      success: false,
      message: error.message,
      stack: environment === "production" ? undefined : error.stack,
    }, error.status);
  }

  if (error instanceof Error) {
    c.var.logger.error(error);
    return c.json({
      success: false,
      message: error.message,
      stack: environment === "production" ? undefined : error.stack,
    }, statusCode);
  }

  return c.json(
    { success: false, message: "Internal server error" },
    500,
  );
};

export default onError;
