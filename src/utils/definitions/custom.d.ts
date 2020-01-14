// eslint-disable-next-line @typescript-eslint/no-unused-vars
import User from "../../resources/user/user.interface";

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
