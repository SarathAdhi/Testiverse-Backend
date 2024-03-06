import type { UserType } from "../schemas/user.schema";

declare module "express" {
  interface Request {
    user?: UserRequest;
  }

  interface UserRequest extends Omit<UserType, "created_at"> {}
}
