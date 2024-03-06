import { JwtPayload as OrgJwtPayload } from "jsonwebtoken";

declare module "jsonwebtoken" {
  export interface JwtPayload extends OrgJwtPayload {
    id: string;
  }
}
