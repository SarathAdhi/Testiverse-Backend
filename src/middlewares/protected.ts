import { RequestHandler } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import User, { UserType } from "../schemas/user.schema";
import { getBearerToken } from "../utils/get-bearer-token";
import { responseHandler } from "../utils/response-handler";
import { verifyJwtWithBearer } from "../utils/verify-jwt";

import { Types } from "mongoose";
import client from "../lib/redis";

export const protectedRoute: RequestHandler = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token)
    return responseHandler(res).error(
      401,
      "You are not logged in! Please login"
    );

  try {
    const decoded = await verifyJwtWithBearer(token);

    const cachedUser = await client.get(String(decoded.user._id));

    if (cachedUser) {
      let user = JSON.parse(cachedUser) as UserType;

      user = { ...user, _id: new Types.ObjectId(user._id!) };

      req.user = user;

      console.log("Cached HIT");
      return next();
    }

    console.log("Cache NOT HIT");

    const user = await User.findOne({
      _id: decoded.user._id,
    })!;

    if (!user) return responseHandler(res).error(401, "User not found");

    await client.set(
      String(decoded.user._id),
      JSON.stringify(user),
      "EX",
      60 * 60 * 24
    );

    req.user = user!;
  } catch (error) {
    req.logout({}, () => {});
    req.user = undefined;

    console.log(error);

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
