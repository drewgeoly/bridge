import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Bridge Relationship OS</h1>
      {user ? (
        <p>Logged in as: {user.email}</p>
      ) : (
        <a 
          href="/api/auth/login"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Login with Google
        </a>
      )}
    </main>
  )
}