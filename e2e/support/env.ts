import type { UserRole } from "../../types/user";

export type TestRole = Extract<UserRole, "admin" | "analyst">;
export type Credentials = { email: string; password: string };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing E2E environment variable: ${name}`);
  return value;
}

function origin(name: string, fallback: string): string {
  return new URL(process.env[name] ?? fallback).origin;
}

function stressRole(): TestRole {
  const value = process.env.E2E_STRESS_ROLE ?? "admin";
  if (value !== "admin" && value !== "analyst") {
    throw new Error("E2E_STRESS_ROLE must be admin or analyst");
  }
  return value;
}

export const e2eEnv = {
  baseURL: origin("E2E_BASE_URL", "http://127.0.0.1:3001"),
  apiURL: origin("E2E_API_URL", "http://127.0.0.1:8080"),
  stressRole: stressRole(),
  credentials(role: TestRole): Credentials {
    const prefix = role === "admin" ? "E2E_ADMIN" : "E2E_ANALYST";
    return {
      email: required(`${prefix}_EMAIL`),
      password: required(`${prefix}_PASSWORD`),
    };
  },
};
