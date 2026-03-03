import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type TokenPayload = {
  sub: string;
  role: string;
  employerId?: string;
  type: "access" | "refresh";
};

export function signAccessToken(payload: Omit<TokenPayload, "type">) {
  return jwt.sign({ ...payload, type: "access" }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: Omit<TokenPayload, "type">) {
  return jwt.sign({ ...payload, type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenTtl as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
}
