import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Rotas de API são excluídas do middleware — auth deve ser verificada aqui
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verifica AAL — bloqueia sessões com MFA pendente
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
    return NextResponse.json({ error: 'MFA required' }, { status: 403 })
  }

  const body = await req.json()
  const authHeader = req.headers.get('Authorization')

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credit-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader ?? '',
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
