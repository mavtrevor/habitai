'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

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
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/dashboard');
      } else {
        await signUpWithEmail(name, email, password);
        // Note: Firebase signUp doesn't take name directly. Need to update profile post-creation.
        toast({ title: 'Signup Successful', description: 'Welcome to HabitAI!' });
        router.push('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: 'Authentication Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOAuth = async (provider: 'google') => {
    setIsLoading(true);
    try {
      if (provider === 'google') await signInWithGoogle();
      toast({ title: 'Login Successful', description: `Welcome via ${provider}!` });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = "An unexpected OAuth error occurred.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'The sign-in pop-up was closed. This might be due to a pop-up blocker or if you closed it prematurely. Please try again and ensure pop-ups are allowed for this site.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'The sign-in pop-up was blocked by your browser. Please disable your pop-up blocker for this site and try again.';
        } else {
          errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: 'OAuth Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <Button variant="outline" onClick={() => handleOAuth('google')} disabled={isLoading} className="w-full">
          <Chrome className="mr-2 h-4 w-4" /> Google
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
