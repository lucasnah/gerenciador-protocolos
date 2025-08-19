// This file extends the existing Express Request type to include our custom 'user' property.

declare global {
  namespace Express {
    export interface Request {
      // We are adding an optional 'user' object to the Request type.
      // This will hold the payload decoded from the JWT.
      user?: { userId: number; role: string };
    }
  }
}