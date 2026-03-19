import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Use a temporary response to capture the session cookies set during exchange
    const cookieJar = new NextResponse();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieJar.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieJar.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let redirectTo = origin;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (!profile || !profile.name) {
          redirectTo = `${origin}/onboarding`;
        }
      }

      // Attach the session cookies to the redirect response
      const response = NextResponse.redirect(redirectTo);
      cookieJar.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
