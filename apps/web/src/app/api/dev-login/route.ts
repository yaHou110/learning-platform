import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

async function handleLogin(request: NextRequest): Promise<Response> {
  const secret = env.AUTH_SECRET || "dev-secret-change-in-production";

  const userPayload = {
    id: "user-admin",
    name: "مدیر ارشد سامانه",
    email: "admin@lp.local",
    role: "super_admin",
    tenantId: "tenant-1001",
  };

  const plainToken = await encode({
    token: userPayload,
    secret,
    salt: "authjs.session-token",
  });

  const secureToken = await encode({
    token: userPayload,
    secret,
    salt: "__Secure-authjs.session-token",
  });

  const url = new URL("/dashboard", request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set("dev_bypass", "1", {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
  });

  response.cookies.set("authjs.session-token", plainToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  response.cookies.set("__Secure-authjs.session-token", secureToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}

export const GET = handleLogin;
export const POST = handleLogin;
