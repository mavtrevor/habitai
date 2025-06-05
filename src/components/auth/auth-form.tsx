'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Github, Chrome } from 'lucide-react'; // Using Github as placeholder for Apple
import { useToast } from '@/hooks/use-toast';
// import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } from '@/lib/firebase'; // Mocked
// import { useRouter } from 'next/navigation';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
}

// Placeholder for Apple icon
const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>
  </svg>
);


export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For signup
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  // const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // if (mode === 'login') {
      //   await signInWithEmail(email, password);
      //   toast({ title: 'Login Successful', description: 'Welcome back!' });
      //   router.push('/dashboard');
      // } else {
      //   await signUpWithEmail(name, email, password);
      //   toast({ title: 'Signup Successful', description: 'Welcome to HabitAI!' });
      //   router.push('/dashboard');
      // }
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: `${mode === 'login' ? 'Login' : 'Signup'} Successful!`, description: `Mock ${mode} successful.` });
      // router.push('/dashboard'); // Uncomment when routing is set up
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'; // Temporary redirect
      }

    } catch (error: any) {
      toast({ title: 'Authentication Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      // if (provider === 'google') await signInWithGoogle();
      // else if (provider === 'apple') await signInWithApple();
      // toast({ title: 'Login Successful', description: `Welcome via ${provider}!` });
      // router.push('/dashboard');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'OAuth Successful!', description: `Mock login with ${provider} successful.` });
      // router.push('/dashboard'); // Uncomment when routing is set up
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'; // Temporary redirect
      }

    } catch (error: any) {
      toast({ title: 'OAuth Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => handleOAuth('google')} disabled={isLoading} className="w-full">
          <Chrome className="mr-2 h-4 w-4" /> Google
        </Button>
        <Button variant="outline" onClick={() => handleOAuth('apple')} disabled={isLoading} className="w-full">
          <AppleIcon /> <span className="ml-2">Apple</span>
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your Name"
              disabled={isLoading}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </Button>
      </form>
    </div>
  );
}
