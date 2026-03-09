"use client";

import { useState, useEffect } from 'react';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp, initiateAnonymousSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Film, Mail, Lock, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle successful sign-in via the auth state listener
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const authPromise = isSignUp 
      ? initiateEmailSignUp(auth, email, password)
      : initiateEmailSignIn(auth, email, password);

    authPromise.catch((error: any) => {
      setLoading(false);
      let message = error.message;
      
      // Provide user-friendly messages for common errors
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already associated with an account. Please sign in instead.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = "Invalid email or password.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      }

      toast({ 
        variant: "destructive", 
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed", 
        description: message 
      });
    });
  };

  const handleGuestSignIn = () => {
    setLoading(true);
    initiateAnonymousSignIn(auth).catch((error: any) => {
      setLoading(false);
      toast({ 
        variant: "destructive", 
        title: "Guest Access Failed", 
        description: error.message 
      });
    });
  };

  return (
    <div className="pt-32 min-h-screen flex items-center justify-center px-4 bg-[url('https://picsum.photos/seed/auth-bg/1920/1080')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <Card className="relative z-10 w-full max-w-md glass border-white/10 overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-white tracking-tight">
            {isSignUp ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </CardTitle>
          <CardDescription className="text-white/50">
            {isSignUp ? "Start your cinematic journey today." : "Log in to access your watchlist and pulse."}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-white/5 border-white/10 pl-10 h-12 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-white/5 border-white/10 pl-10 h-12 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/80 h-12 font-headline text-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Register" : "Sign In")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-white/30">Or continue as</span></div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full glass border-white/10 h-12 font-headline"
              onClick={handleGuestSignIn}
              disabled={loading}
            >
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              Guest Entry
            </Button>

            <button 
              type="button"
              className="text-sm text-white/40 hover:text-primary transition-colors mt-2"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Register"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
