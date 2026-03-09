
"use client";

import { useState } from 'react';
import { analyzeFriendCompatibility, FriendCompatibilityAnalyzerOutput } from '@/ai/flows/friend-compatibility-analyzer-flow';
import { MOCK_MOVIES } from '../lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Loader2, Heart, Film, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function FriendsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FriendCompatibilityAnalyzerOutput | null>(null);

  const mockFriendMovies = [
    { title: 'Interstellar', genres: ['Sci-Fi', 'Drama'], rating: 9 },
    { title: 'Inception', genres: ['Sci-Fi', 'Action'], rating: 10 },
    { title: 'The Prestige', genres: ['Drama', 'Mystery'], rating: 9 },
    { title: 'Memento', genres: ['Thriller', 'Mystery'], rating: 8 },
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const userMovies = MOCK_MOVIES.filter(m => m.status === 'watched').map(m => ({
        title: m.title,
        genres: m.genres,
        rating: m.rating || 5
      }));
      
      const output = await analyzeFriendCompatibility({
        user1Movies: userMovies,
        user2Movies: mockFriendMovies
      });
      setResult(output);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen max-w-5xl mx-auto px-4 md:px-8 pb-16">
      <div className="text-center space-y-4 mb-12 animate-fade-in">
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight">FRIEND <span className="text-gradient">SYNC</span></h1>
        <p className="text-white/60 text-lg">Measure your cinematic wavelength with friends.</p>
      </div>

      {!result ? (
        <div className="flex flex-col items-center justify-center h-[500px] glass border-white/5 rounded-3xl p-8 animate-fade-in">
           <div className="flex items-center gap-8 mb-12 relative">
             <div className="w-24 h-24 rounded-full border-2 border-primary/30 p-1 relative z-10">
               <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">ME</div>
             </div>
             <div className="w-32 h-1 bg-gradient-to-r from-primary/30 via-white/10 to-purple-500/30 rounded-full relative">
                <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 w-8 h-8" />
             </div>
             <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 p-1 relative z-10">
               <div className="w-full h-full rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-2xl">JD</div>
             </div>
           </div>

           <div className="text-center space-y-6 max-w-md">
             <h2 className="text-2xl font-headline text-white">Compare with John Doe</h2>
             <p className="text-white/50">Find out which movies you both love and discover new ones to watch together.</p>
             <Button 
               size="lg" 
               className="w-full bg-primary hover:bg-primary/80 font-headline"
               onClick={handleAnalyze}
               disabled={loading}
             >
               {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Users className="w-5 h-5 mr-2" />}
               Analyze Compatibility
             </Button>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-white font-headline text-3xl">Compatibility Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="relative h-48 flex items-center justify-center">
                 <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <Heart className="w-40 h-40 text-primary fill-primary" />
                 </div>
                 <span className="text-7xl font-bold text-white relative z-10">{result.compatibilityScore}%</span>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <Progress value={result.compatibilityScore} className="h-3 bg-white/5" />
                <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  <span>Divergent</span>
                  <span>Perfect Match</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle className="text-white font-headline flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" /> Shared Classics
                </CardTitle>
                <CardDescription className="text-white/50">Movies you've both experienced.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.sharedMovies.map((title, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-white font-medium">{title}</span>
                      <Badge className="bg-primary/20 text-primary">Both Watched</Badge>
                    </div>
                  ))}
                  {result.sharedMovies.length === 0 && <p className="text-white/30 italic">No shared movies found yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/5">
              <CardHeader>
                <CardTitle className="text-white font-headline flex items-center gap-2 text-gradient">
                  <Sparkles className="w-5 h-5 text-primary" /> Next Watch Suggestions
                </CardTitle>
                <CardDescription className="text-white/50">AI suggestions for your next movie night.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                  {result.suggestedMovies.map((title, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg group hover:bg-white/10 transition-colors border border-white/5 cursor-pointer">
                      <span className="text-white/80 group-hover:text-white transition-colors">{title}</span>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
