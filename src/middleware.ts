import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Se as env vars não estiverem configuradas, deixa passar sem bloquear
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    if (!user && !isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user) {
      // Verifica nível AAL — se MFA está ativo mas não foi completado, bloqueia acesso
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      const mfaPending = aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel

      if (mfaPending && !isLoginPage) {
        // Sessão AAL1 com MFA pendente — força voltar ao login para completar TOTP
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (!mfaPending && isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch {
    // Se auth falhar, redireciona para login — nunca expõe rotas protegidas
    if (!request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Exclui: arquivos estáticos, imagens, favicon, rotas de API e webhooks
     * Inclui: todas as páginas da aplicação
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
