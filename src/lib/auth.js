import { supabase } from './supabase.js'

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const ADMIN_EMAILS = [
  'pdemora@rubatec.cat',
  'ggarcia@rubatec.cat',
  'ssomavilla@rubatec.cat',
  'sgarcia@rubatec.cat',
]

export function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email)
}

export function isAdminEmail(email) {
  return email && ADMIN_EMAILS.includes(email.toLowerCase().trim())
}
