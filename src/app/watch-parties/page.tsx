
"use client";

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { WatchParty } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Loader2, 
  ArrowRight, 
  Tv, 
  Calendar, 
  CheckCircle2, 
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function WatchPartiesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newParty, setNewParty] = useState({ title: '', description: '', date: '' });

  const partiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'watchParties'), orderBy('scheduledAt', 'desc'));
  }, [firestore]);

  const { data: parties, isLoading } = useCollection<WatchParty>(partiesQuery);

  const handleCreateParty = async () => {
    if (!user || !firestore) return;
    if (!newParty.title || !newParty.date) {
      toast({ variant: "destructive", title: "Missing details", description: "Title and date are required." });
      return;
    }

    const partyRef = doc(collection(firestore, 'watchParties'));
    const partyId = partyRef.id;

    const partyData: WatchParty = {
      id: partyId,
      hostId: user.uid,
      hostName: user.email?.split('@')[0].toUpperCase() || 'GUEST',
      title: newParty.title,
      description: newParty.description,
      scheduledAt: new Date(newParty.date).toISOString(),
      status: 'voting'
    };

    // Use non-blocking setDocument for initial party doc
    setDocumentNonBlocking(partyRef, partyData, { merge: true });
    
    // Also add host as a member immediately
    const memberRef = doc(firestore, `watchParties/${partyId}/members/${user.uid}`);
    setDocumentNonBlocking(memberRef, {
      id: user.uid,
      userId: user.uid,
      username: partyData.hostName,
      avatarUrl: `https://picsum.photos/seed/${user.uid}/100`,
      joinedAt: new Date().toISOString()
    }, { merge: true });
    
    setIsCreating(false);
    setNewParty({ title: '', description: '', date: '' });
    toast({ title: "Party Scheduled!", description: "Invite your friends to start the vote." });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen max-w-6xl mx-auto px-4 md:px-8 pb-20 space-y-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-5xl font-headline font-bold text-white tracking-tighter uppercase">WATCH <span className="text-gradient">PARTIES</span></h1>
          <p className="text-white/50 text-lg">Synchronize your cinema experience with friends.</p>
        </div>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/80 h-12 px-8 font-headline">
              <Plus className="w-5 h-5 mr-2" /> Start New Party
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dark border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">CREATE PARTY</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Party Title</label>
                <Input 
                  placeholder="e.g. Sunday Sci-Fi Night" 
                  className="bg-white/5 border-white/10"
                  value={newParty.title}
                  onChange={(e) => setNewParty({...newParty, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Description</label>
                <Textarea 
                  placeholder="What's the vibe?" 
                  className="bg-white/5 border-white/10 min-h-[100px]"
                  value={newParty.description}
                  onChange={(e) => setNewParty({...newParty, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Scheduled Date & Time</label>
                <Input 
                  type="datetime-local" 
                  className="bg-white/5 border-white/10"
                  value={newParty.date}
                  onChange={(e) => setNewParty({...newParty, date: e.target.value})}
                />
              </div>
              <Button className="w-full bg-primary h-12" onClick={handleCreateParty}>
                Initialize Watch Party
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!parties || parties.length === 0 ? (
        <div className="h-[400px] glass border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-8">
           <Tv className="w-16 h-16 text-white/10 mb-6" />
           <h2 className="text-2xl font-headline text-white mb-2">The Lobby is Empty</h2>
           <p className="text-white/40 max-w-md">No watch parties are currently scheduled. Be the host and start a tradition.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {parties.map(party => (
            <Card key={party.id} className="glass border-white/5 hover:border-primary/40 transition-all group overflow-hidden flex flex-col">
              <CardHeader className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                <div className="flex justify-between items-start mb-2">
                   <Badge className={cn(
                     "border-none font-bold uppercase tracking-widest text-[10px]",
                     party.status === 'voting' ? "bg-yellow-500/20 text-yellow-500" : 
                     party.status === 'ready' ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/40"
                   )}>
                     {party.status}
                   </Badge>
                   <span className="text-[10px] text-white/40 flex items-center gap-1 font-bold">
                     <Shield className="w-3 h-3" /> HOST: {party.hostName}
                   </span>
                </div>
                <CardTitle className="text-2xl font-headline text-white line-clamp-1">{party.title}</CardTitle>
                <CardDescription className="text-white/40 line-clamp-2">{party.description || "No description provided."}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 flex-1">
                <div className="flex items-center gap-3 text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{format(new Date(party.scheduledAt), 'PPP p')}</span>
                </div>

                {party.selectedMovieId && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                     <CheckCircle2 className="w-5 h-5 text-primary" />
                     <div className="overflow-hidden">
                       <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Selected Feature</p>
                       <p className="text-white font-medium truncate">{party.selectedMovieTitle}</p>
                     </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0 pb-6">
                <Link href={`/watch-parties/${party.id}`} className="w-full">
                  <Button variant="outline" className="w-full glass border-white/10 group-hover:bg-primary group-hover:text-white transition-all h-12 uppercase tracking-widest font-bold text-xs">
                    Enter Party Room <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
