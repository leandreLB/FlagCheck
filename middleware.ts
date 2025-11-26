import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/webhook',
])

export default clerkMiddleware(async (auth, request) => {
  // Vérifier si la route nécessite une authentification
  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    
    // Si l'utilisateur n'est pas authentifié, rediriger vers /sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url)
      // Ajouter l'URL de retour pour rediriger après connexion
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

