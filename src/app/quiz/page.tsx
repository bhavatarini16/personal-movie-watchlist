
"use client";

import { useState } from 'react';
import { cinemaPersonalityQuiz, CinemaPersonalityQuizOutput } from '@/ai/flows/cinema-personality-quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Film, Sparkles, Loader2, RefreshCw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function QuizPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<CinemaPersonalityQuizOutput | null>(null);
  const [genres, setGenres] = useState('');
  const [movies, setMovies] = useState('');
  const [experience, setExperience] = useState('');

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const output = await cinemaPersonalityQuiz({
        favoriteGenres: genres.split(',').map(g => g.trim()),
        favoriteMovies: movies.split('\n').map(m => m.trim()).filter(m => m !== ''),
        movieExperience: experience
      });
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Analysis failed", description: "The AI could not determine your personality. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = () => {
    if (!user || !result) return;
    setIsSaving(true);
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}`), {
      personality: {
        type: result.personalityType,
        description: result.description
      }
    });
    toast({ title: "Personality Updated!", description: `You are now officially a ${result.personalityType}.` });
    setIsSaving(false);
  };

  const handleReset = () => {
    setResult(null);
    setGenres('');
    setMovies('');
    setExperience('');
  };

  return (
    <div className="pt-24 min-h-screen max-w-4xl mx-auto px-4 md:px-8 pb-16">
      <div className="text-center space-y-4 mb-12 animate-fade-in">
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight">CINEMA <span className="text-gradient">IDENTITY</span></h1>
        <p className="text-white/60 text-lg">Uncover your cinematic persona with AI-powered analysis.</p>
      </div>

      {!result ? (
        <Card className="glass border-white/5 max-w-2xl mx-auto overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-primary" />
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Profile Your Taste
            </CardTitle>
            <CardDescription className="text-white/50">Our AI will analyze your deep preferences to classify your style.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">What genres do you gravitate towards?</label>
              <Input 
                placeholder="e.g. Sci-Fi, Psychological Thriller, Neo-Noir" 
                className="bg-white/5 border-white/10 text-white h-12"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
              />
              <p className="text-[10px] text-white/30">Separate genres with commas</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Top 3 movies and why they moved you?</label>
              <Textarea 
                placeholder="1. Interstellar - for the scale and father-daughter bond..." 
                className="bg-white/5 border-white/10 text-white min-h-[120px]"
                value={movies}
                onChange={(e) => setMovies(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">What emotional state do you seek in cinema?</label>
              <Textarea 
                placeholder="e.g. I want to be challenged intellectually, I want to escape reality, or I want a good cry..." 
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/80 h-14 text-lg font-headline shadow-xl shadow-primary/20"
              onClick={handleStartQuiz}
              disabled={loading || !genres || !movies || !experience}
            >
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Your Soul...</> : <><Sparkles className="w-5 h-5 mr-2" /> Discover My Persona</>}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="animate-in zoom-in-95 duration-500">
          <Card className="glass border-primary/20 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary/20 text-primary border-primary/20 text-xs font-bold uppercase tracking-widest">Profile Analysis Result</Badge>
            </div>
            <CardHeader className="text-center pt-12 pb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl shadow-primary/20">
                <Sparkles className="text-primary w-12 h-12" />
              </div>
              <CardTitle className="text-4xl font-headline text-white mb-2">{result.personalityType}</CardTitle>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
            </CardHeader>
            <CardContent className="px-8 text-center pb-8">
              <p className="text-white/80 text-xl leading-relaxed italic">
                "{result.description}"
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/80 h-12 font-bold" 
                onClick={handleSaveToProfile}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Apply to My Profile
              </Button>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="secondary" className="glass border-white/10" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retake
                </Button>
                <Link href="/profile" className="w-full">
                  <Button variant="outline" className="w-full glass border-white/10">View Profile</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
