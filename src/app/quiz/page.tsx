
"use client";

import { useState } from 'react';
import { cinemaPersonalityQuiz, CinemaPersonalityQuizOutput } from '@/ai/flows/cinema-personality-quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Film, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function QuizPage() {
  const [loading, setLoading] = useState(false);
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
    } finally {
      setLoading(false);
    }
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
            <CardDescription className="text-white/50">Answer a few questions about your movie habits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Favorite Genres</label>
              <Input 
                placeholder="e.g. Sci-Fi, Thriller, Noir" 
                className="bg-white/5 border-white/10 text-white"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
              />
              <p className="text-[10px] text-white/30">Separate genres with commas</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Movies You Love</label>
              <Textarea 
                placeholder="List a few movies that defined your taste..." 
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                value={movies}
                onChange={(e) => setMovies(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">What are you looking for in a film?</label>
              <Textarea 
                placeholder="e.g. Emotional depth, mind-bending plots, non-stop action..." 
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/80 h-12 text-lg font-headline"
              onClick={handleStartQuiz}
              disabled={loading || !genres || !movies || !experience}
            >
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5 mr-2" /> Determine My Personality</>}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="animate-in zoom-in-95 duration-500">
          <Card className="glass border-primary/20 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary/20 text-primary border-primary/20 text-xs font-bold uppercase tracking-widest">Analysis Complete</Badge>
            </div>
            <CardHeader className="text-center pt-12 pb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl shadow-primary/20">
                <Sparkles className="text-primary w-12 h-12" />
              </div>
              <CardTitle className="text-4xl font-headline text-white mb-2">{result.personalityType}</CardTitle>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
            </CardHeader>
            <CardContent className="px-8 text-center pb-8">
              <p className="text-white/80 text-lg leading-relaxed italic">
                "{result.description}"
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button variant="secondary" className="w-full glass border-white/10" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retake Quiz
              </Button>
              <Button variant="ghost" className="w-full text-white/40">Share Results</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
