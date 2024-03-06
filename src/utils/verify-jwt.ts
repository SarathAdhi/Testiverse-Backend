import { Request } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { getBearerToken } from "./get-bearer-token";
import { SECRET_KEY } from "./my-envs";

export const verifyJwtWithRequest = async (req: Request) => {
  try {
    return (await jwt.verify(getBearerToken(req)!, SECRET_KEY!)) as JwtPayload;
  } catch (error: any) {
    if (error instanceof TokenExpiredError) throw new Error("JWT Expired");

    throw new Error(error?.message || error);
  }
};

export const verifyJwtWithBearer = async (bearer: string) => {
  // console.log(bearer);

  try {
    return (await jwt.verify(bearer, SECRET_KEY!)) as JwtPayload;
  } catch (error: any) {
    if (error instanceof TokenExpiredError) throw new Error("JWT Expired");

    throw new Error(error?.message || error);
  }
};
