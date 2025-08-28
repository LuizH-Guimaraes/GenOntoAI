import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.API_KEY;

  console.log(API_KEY);
  return NextResponse.json({ user: "Luiz Guimaraes" });
}
