import { supabase } from './supabase'

export async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })
}
