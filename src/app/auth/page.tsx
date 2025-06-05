import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AuthPage({ searchParams }: { searchParams: { mode?: string } }) {
  const isSignUpMode = searchParams.mode === 'signup';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-2xl bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">{isSignUpMode ? 'Create an Account' : 'Welcome Back!'}</CardTitle>
          <CardDescription>
            {isSignUpMode ? 'Join HabitAI to start building better habits.' : 'Sign in to continue your journey.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm initialMode={isSignUpMode ? 'signup' : 'login'} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUpMode ? (
              <>
                Already have an account?{' '}
                <Link href="/auth" className="font-medium text-primary hover:underline">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link href="/auth?mode=signup" className="font-medium text-primary hover:underline">
                  Sign Up
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing, you agree to HabitAI&apos;s <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
      </p>
    </div>
  );
}
