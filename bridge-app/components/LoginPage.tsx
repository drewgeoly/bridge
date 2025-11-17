'use client'

import { Button } from './ui/button'
import { Card } from './ui/card'
import { LogIn, UserPlus } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const handleSignUp = () => {
    window.location.href = '/api/auth/login'
  }

  const handleLogIn = () => {
    window.location.href = '/api/auth/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <h1
            className="text-6xl text-slate-800 mb-4"
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            bridge
          </h1>
          <p className="text-xl text-slate-600">
            Stay connected with the people who matter
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/40 backdrop-blur-md border-white/50 shadow-lg p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-slate-800">
                Welcome to Bridge
              </h2>
              <p className="text-slate-600">
                Sign in or create an account to get started
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleSignUp}
                className="w-full bg-white/60 backdrop-blur-sm hover:bg-white/80 text-slate-700 border border-white/50 h-12 text-base"
                size="lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Sign up with Google
              </Button>

              <Button
                onClick={handleLogIn}
                variant="outline"
                className="w-full bg-white/40 backdrop-blur-sm hover:bg-white/60 text-slate-700 border-white/50 h-12 text-base"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Log in with Google
              </Button>
            </div>

            <p className="text-sm text-center text-slate-500">
              By continuing, you agree to our terms of service and privacy policy
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

