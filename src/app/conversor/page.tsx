import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConversorClient } from '@/components/conversor/ConversorClient'

export default async function ConversorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <ConversorClient />
}
