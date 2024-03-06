import type { User as UserType } from "../schemas/user.schema";

declare module "express" {
  interface Request {
    user?: Request["user"] & Omit<UserType, "created_at">;
  }

  interface User extends Omit<UserType, "created_at"> {}
}
