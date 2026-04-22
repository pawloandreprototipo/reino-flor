import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Login — Reino Flor Admin' }

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50">
      {children}
    </div>
  )
}
