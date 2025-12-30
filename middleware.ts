import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/stripe(.*)',
  '/api/stripe/webhook(.*)',
  '/', // Page principale accessible sans authentification
])

// Routes qui nécessitent une authentification
const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/history(.*)',
  '/results(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Exclure explicitement les webhooks Stripe
  if (request.nextUrl.pathname.includes('/webhook')) {
    return NextResponse.next();
  }
  
  // Vérifier si la route nécessite une authentification
  if (isProtectedRoute(request)) {
    const { userId } = await auth()
    
    // Si l'utilisateur n'est pas authentifié, rediriger vers /sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}

