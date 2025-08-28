export interface User {
  sub: string;
  role?: string;
  permissions?: string[];
  accessToken: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}