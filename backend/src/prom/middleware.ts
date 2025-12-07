import { NextFunction, Request, Response } from "express";
import { requestCounter } from "./counter";
import { httpRequestDuration } from "@/prom/counter";
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on("finish", function () {
    const endTime = Date.now();
    const duration = endTime - startTime;

    requestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      },
      duration
    );
  });
  next();
};
