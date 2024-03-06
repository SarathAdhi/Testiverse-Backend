import { RequestHandler } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import User from "../schemas/user.schema";
import { getBearerToken } from "../utils/get-bearer-token";
import { responseHandler } from "../utils/response-handler";
import { verifyJwtWithBearer } from "../utils/verify-jwt";

export const protectedRoute: RequestHandler = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token)
    return responseHandler(res).error(
      401,
      "You are not logged in! Please login"
    );

  try {
    const decoded = await verifyJwtWithBearer(token);

    const user = await User.findOne({
      uuid: decoded.id,
    })!;

    req.user = user!;
  } catch (error) {
    req.logout({}, () => {});
    req.user = undefined;

    if (error instanceof TokenExpiredError) {
      // JWT is expired
      return responseHandler(res).error(401, "JWT expired");
    } else {
      // console.log({ error });
      return responseHandler(res).error(401, "Invalid JWT");
    }
  }

  next();
};
