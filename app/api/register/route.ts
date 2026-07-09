import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Pre-check email unique constraint
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
    }

    // Pre-check username unique constraint
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // Secure encryption matching the login check
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("REGISTRATION_FAILURE:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}