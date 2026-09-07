import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if ((path === '/login' || path === '/register') && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        const publicPaths = ['/', '/login', '/register', '/api/auth', '/api/init']
        if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
          return true
        }
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/measurements/:path*',
    '/goals/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
}
