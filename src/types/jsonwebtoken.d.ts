import "jsonwebtoken";
import { UserType } from "../schemas/user.schema";

declare module "jsonwebtoken" {
  interface JwtPayload {
    user: UserType;
  }
}
