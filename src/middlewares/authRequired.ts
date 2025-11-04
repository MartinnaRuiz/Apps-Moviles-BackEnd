import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthedRequest extends Request {
  userId?: number;
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Token ausente" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}
