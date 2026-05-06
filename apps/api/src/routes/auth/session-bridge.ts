import type { FastifyRequest } from "fastify";

export interface SessionStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(): void;
}

export interface SessionUser {
  id: string;
  email?: string | null;
  role?: "user" | "admin";
  status?: "active" | "disabled";
}

export function getSession(request: FastifyRequest) {
  return (request as FastifyRequest & { session: SessionStore }).session;
}
