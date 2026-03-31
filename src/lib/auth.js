import { supabase } from './supabase.js'

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

const ADMIN_EMAILS = [
  'pdemora@rubatec.cat',
  'ggarcia@rubatec.cat',
  'ssomavilla@rubatec.cat',
  'sgarcia@rubatec.cat',
]

export function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email)
}
