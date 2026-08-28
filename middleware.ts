import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"

import { buildSignInUrl, getSafeRedirectPath } from "@/lib/auth-redirect"

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/signin") ||
      req.nextUrl.pathname.startsWith("/signup")

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(
          new URL(
            getSafeRedirectPath(req.nextUrl.searchParams.get("redirect")),
            req.url
          )
        )
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }
      return NextResponse.redirect(new URL(buildSignInUrl(from), req.url))
    }
  },
  {
    callbacks: {
      async authorized() {
        // Return true here so the middleware function above executes and handles redirection with query params
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/today/:path*",
    "/items/:path*",
    "/insights/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
    "/signin",
    "/signup",
  ],
}
