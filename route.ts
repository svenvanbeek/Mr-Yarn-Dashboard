import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "mr_yarn_auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Onjuist wachtwoord." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  // De cookie bevat NOOIT het wachtwoord zelf, alleen een losse geheime
  // waarde — zo lekt het wachtwoord niet mee als iemand de cookie zou zien.
  response.cookies.set(COOKIE_NAME, process.env.SESSION_SECRET || "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
