
'use client';

import type { FC } from 'react';
import React, { useState, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, sendEmailVerification } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import { ToastAction } from '@/components/ui/toast';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
}

export const AuthForm: FC<AuthFormProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For signup
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedUserForResend, setUnverifiedUserForResend] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleResendVerificationEmail = useCallback(async () => {
    if (!unverifiedUserForResend) return;
    setIsLoading(true);
    try {
      await sendEmailVerification(unverifiedUserForResend);
      toast({
        title: 'Verification Email Resent',
        description: 'A new verification email has been sent. Please check your inbox.',
      });
      setUnverifiedUserForResend(null); 
    } catch (error: any) {
      toast({ title: 'Error Resending Email', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [unverifiedUserForResend, toast]);

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setUnverifiedUserForResend(null);

    try {
      if (mode === 'login') {
        const user = await signInWithEmail(email, password); 
        if (user && !user.emailVerified) {
          setUnverifiedUserForResend(user); 
          toast({
            title: 'Email Not Verified',
            description: 'Please verify your email address before signing in. Check your inbox (and spam folder) for the verification link.',
            variant: 'destructive',
            duration: 10000,
            action: (
              <ToastAction
                altText="Resend verification email"
                onClick={handleResendVerificationEmail}
              >
                Resend Email
              </ToastAction>
            ),
          });
          await signOut(); 
          setIsLoading(false);
          return;
        }
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 0);
      } else { 
        await signUpWithEmail(name, email, password); 
        toast({
          title: 'Signup Successful! Please Verify Your Email',
          description: `A verification email has been sent to ${email}. Please check your inbox (and spam folder) and click the verification link before signing in.`,
          duration: 10000,
        });
        setMode('login');
        setPassword('');
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
  }, [mode, email, password, name, toast, router, handleResendVerificationEmail]);

  const handleOAuth = useCallback(async (provider: 'google') => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: 'Login Successful', description: `Welcome via ${provider}!` });
      setTimeout(() => {
        router.push('/dashboard');
      }, 0);
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
  }, [toast, router]);


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
