import { JwtPayload } from "jsonwebtoken";

declare module "jsonwebtoken" {
  export interface JwtPayload {
    id: string;
    email: string;
    name: string;
  }
}
