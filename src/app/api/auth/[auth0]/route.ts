// app/api/auth/[auth0]/route.ts
import { auth0 } from "@/lib/auth0"; // Ajuste o caminho
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return await auth0.middleware(req);
}

export async function POST(req: NextRequest) {
  return await auth0.middleware(req);
}
