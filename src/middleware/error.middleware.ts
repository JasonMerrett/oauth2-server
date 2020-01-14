import { Request, Response } from "express";
import HttpException from "../utils/exceptions/HttpExceptions";

function errorMiddleware(
  error: HttpException,
  req: Request,
  res: Response
): void {
  const status = error.status || 500;
  const message = error.message || "Something went wrong";
  res.status(status).send({
    status,
    message
  });
}

export default errorMiddleware;
