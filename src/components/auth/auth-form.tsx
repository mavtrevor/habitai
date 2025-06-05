'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Chrome } from 'lucide-react'; // Github was a placeholder, Chrome is for Google
import { useToast } from '@/hooks/use-toast';
// import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/firebase'; // Mocked
// import { useRouter } from 'next/navigation';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
}

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
  
  const handleOAuth = async (provider: 'google') => { // Only google is supported now
    setIsLoading(true);
    try {
      // if (provider === 'google') await signInWithGoogle();
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
      <div className="grid grid-cols-1 gap-4"> {/* Changed to grid-cols-1 */}
        <Button variant="outline" onClick={() => handleOAuth('google')} disabled={isLoading} className="w-full">
          <Chrome className="mr-2 h-4 w-4" /> Google
        </Button>
        {/* Apple button removed */}
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
