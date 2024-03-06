import { Response as ExpressReponseType } from "express";

export const responseHandler = (res: ExpressReponseType) => ({
  success: (statusCode: number, message: string, data?: any) =>
    res.status(statusCode).json({
      message,
      status: "success",
      code: statusCode,
      data,
    }),

  error: (statusCode: number, error: any) => {
    return res.status(statusCode).json({
      message: error?.message || error,
      error: true,
      status: "error",
      code: statusCode,
    });
  },
});
