
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, setDoc, deleteDoc, where, getDoc } from 'firebase/firestore';
import { WatchParty, WatchPartyNomination, WatchPartyMember, Movie, UserProfile } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, 
  Calendar, 
  UserPlus, 
  Plus, 
  Vote, 
  CheckCircle2, 
  Film, 
  ArrowLeft, 
  Trash2,
  Users,
  Sparkles,
  Play,
  Share2,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { searchMovies } from '@/app/lib/tmdb-service';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

export default function WatchPartyDetailsPage() {
  const params = useParams();
  const partyId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [potentialFriends, setPotentialFriends] = useState<UserProfile[]>([]);

  // Core Data
  const partyRef = useMemoFirebase(() => doc(firestore, 'watchParties', partyId), [firestore, partyId]);
  const { data: party, isLoading: isPartyLoading } = useDoc<WatchParty>(partyRef);

  const membersRef = useMemoFirebase(() => collection(firestore, `watchParties/${partyId}/members`), [firestore, partyId]);
  const { data: members } = useCollection<WatchPartyMember>(membersRef);

  const nominationsRef = useMemoFirebase(() => collection(firestore, `watchParties/${partyId}/nominations`), [firestore, partyId]);
  const { data: nominations } = useCollection<WatchPartyNomination>(nominationsRef);

  const isHost = party?.hostId === user?.uid;
  const isMember = members?.some(m => m.userId === user?.uid);

  // Fetch Host's Friends for Invitation
  useEffect(() => {
    if (isHost && isInviting && user) {
      const fetchFriends = async () => {
        const userDoc = await getDoc(doc(firestore, `users/${user.uid}`));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          const friendIds = Object.keys(userData.friends || {});
          
          const friendProfiles = await Promise.all(
            friendIds.map(async (id) => {
              const fDoc = await getDoc(doc(firestore, `users/${id}`));
              return fDoc.exists() ? (fDoc.data() as UserProfile) : null;
            })
          );
          
          setPotentialFriends(friendProfiles.filter(p => p !== null) as UserProfile[]);
        }
      };
      fetchFriends();
    }
  }, [isHost, isInviting, user, firestore]);

  const handleJoin = async () => {
    if (!user || !firestore) return;
    const memberRef = doc(firestore, `watchParties/${partyId}/members/${user.uid}`);
    setDoc(memberRef, {
      id: user.uid,
      userId: user.uid,
      username: user.email?.split('@')[0].toUpperCase() || 'GUEST',
      avatarUrl: `https://picsum.photos/seed/${user.uid}/100`,
      joinedAt: new Date().toISOString()
    });
    toast({ title: "Joined the Party!", description: "You can now nominate and vote for movies." });
  };

  const handleAddMember = async (friend: UserProfile) => {
    if (!firestore) return;
    const memberRef = doc(firestore, `watchParties/${partyId}/members/${friend.id}`);
    setDoc(memberRef, {
      id: friend.id,
      userId: friend.id,
      username: friend.username,
      avatarUrl: friend.avatarUrl || `https://picsum.photos/seed/${friend.id}/100`,
      joinedAt: new Date().toISOString()
    });
    toast({ title: "Member Added", description: `${friend.username} has been invited to the party.` });
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchMovies(val);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleNominate = async (movie: Movie) => {
    if (!user || !firestore) return;
    const nominationRef = doc(collection(firestore, `watchParties/${partyId}/nominations`));
    setDoc(nominationRef, {
      id: nominationRef.id,
      movieId: movie.tmdbId,
      movieTitle: movie.title,
      posterUrl: movie.posterUrl,
      nominatorId: user.uid,
      nominatorName: user.email?.split('@')[0].toUpperCase() || 'GUEST',
      votes: {}
    });
    setSearchQuery('');
    setSearchResults([]);
    toast({ title: "Movie Nominated!", description: `${movie.title} added to the ballot.` });
  };

  const handleVote = async (nomination: WatchPartyNomination) => {
    if (!user || !firestore || party?.status !== 'voting') return;
    const nominationRef = doc(firestore, `watchParties/${partyId}/nominations/${nomination.id}`);
    
    const newVotes = { ...nomination.votes };
    if (newVotes[user.uid]) {
      delete newVotes[user.uid];
    } else {
      newVotes[user.uid] = true;
    }

    updateDocumentNonBlocking(nominationRef, { votes: newVotes });
  };

  const handleLockIn = async (nomination: WatchPartyNomination) => {
    if (!isHost) return;
    updateDocumentNonBlocking(partyRef, {
      status: 'ready',
      selectedMovieId: nomination.movieId,
      selectedMovieTitle: nomination.movieTitle,
      selectedMoviePoster: nomination.posterUrl
    });
    toast({ title: "Feature Film Locked!", description: `The party is now set for ${nomination.movieTitle}.` });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied!", description: "Share it with your cinema circle." });
  };

  if (isPartyLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!party) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-headline text-white">Party Not Found</h2>
        <Button onClick={() => router.push('/watch-parties')}>Back to Lobby</Button>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-20">
      <Button variant="ghost" className="mb-8 text-white/50" onClick={() => router.push('/watch-parties')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lobby
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Party Info & Voting */}
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
               <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-none uppercase tracking-widest text-[10px] font-bold">
                  {party.status} Phase
                </Badge>
                <h1 className="text-5xl font-headline font-bold text-white tracking-tighter uppercase">{party.title}</h1>
                <p className="text-white/60 text-lg">{party.description}</p>
               </div>
               {!isMember ? (
                 <Button size="lg" className="bg-primary hover:bg-primary/80 animate-pulse shadow-2xl shadow-primary/20" onClick={handleJoin}>
                   Join Watch Party
                 </Button>
               ) : (
                 <div className="flex gap-2">
                   {isHost && (
                     <Dialog open={isInviting} onOpenChange={setIsInviting}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="glass border-white/10">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Members
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-dark border-white/10 text-white">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-xl">INVITE FRIENDS</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <p className="text-sm text-white/40">Select friends to add them directly to this watch party.</p>
                            <ScrollArea className="h-64">
                              <div className="space-y-3">
                                {potentialFriends.length > 0 ? (
                                  potentialFriends.map(friend => {
                                    const isAlreadyMember = members?.some(m => m.userId === friend.id);
                                    return (
                                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="w-8 h-8">
                                            <AvatarImage src={friend.avatarUrl} />
                                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium">{friend.username}</span>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant={isAlreadyMember ? "ghost" : "default"}
                                          disabled={isAlreadyMember}
                                          onClick={() => handleAddMember(friend)}
                                        >
                                          {isAlreadyMember ? <UserCheck className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-center py-10 text-white/20 italic">No friends found to invite.</p>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </DialogContent>
                     </Dialog>
                   )}
                   <Button variant="secondary" className="glass border-white/10" onClick={copyInviteLink}>
                     <Share2 className="w-4 h-4 mr-2" /> Invite Link
                   </Button>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass border-white/5 p-4 rounded-2xl flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-xl">
                   <Calendar className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Showtime</p>
                   <p className="text-white font-medium">{format(new Date(party.scheduledAt), 'PPP p')}</p>
                 </div>
               </div>
               <div className="glass border-white/5 p-4 rounded-2xl flex items-center gap-4">
                 <div className="p-3 bg-blue-500/10 rounded-xl">
                   <Users className="w-6 h-6 text-blue-400" />
                 </div>
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Member Count</p>
                   <p className="text-white font-medium">{members?.length || 0} Cinema Buffs</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Voting Area */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold text-white flex items-center gap-3">
                <Vote className="w-6 h-6 text-primary" /> THE BALLOT
              </h2>
              {isMember && party.status === 'voting' && (
                <div className="relative w-64">
                   <Input 
                    placeholder="Nominate a movie..." 
                    className="bg-white/5 border-white/10 pr-10"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                   />
                   {searchResults.length > 0 && (
                     <div className="absolute top-full left-0 right-0 mt-2 glass-dark border-white/10 rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto shadow-2xl">
                        {searchResults.map(m => (
                          <div 
                            key={m.tmdbId} 
                            onClick={() => handleNominate(m)}
                            className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                             <img src={m.posterUrl} className="w-8 h-12 object-cover rounded shadow-lg" />
                             <span className="text-sm font-medium text-white">{m.title}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {nominations?.map(nom => {
                const voteCount = Object.keys(nom.votes || {}).length;
                const hasVoted = user && nom.votes?.[user.uid];

                return (
                  <Card key={nom.id} className="glass border-white/5 overflow-hidden group">
                    <div className="aspect-video relative">
                       <Image src={nom.posterUrl} alt={nom.movieTitle} fill className="object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                       <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Nominated by {nom.nominatorName}</p>
                            <h3 className="text-lg font-headline font-bold text-white line-clamp-1">{nom.movieTitle}</h3>
                          </div>
                       </div>
                    </div>
                    <CardContent className="pt-4 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Badge variant="secondary" className="bg-white/10 text-white border-none font-bold">
                           {voteCount} Votes
                         </Badge>
                       </div>
                       <div className="flex items-center gap-2">
                         {party.status === 'voting' && isMember && (
                            <Button 
                              size="sm" 
                              variant={hasVoted ? "default" : "outline"} 
                              className={cn("h-8 px-4", hasVoted ? "bg-primary" : "glass border-white/10")}
                              onClick={() => handleVote(nom)}
                            >
                              <Vote className="w-3 h-3 mr-2" />
                              {hasVoted ? "Voted" : "Vote"}
                            </Button>
                         )}
                         {isHost && party.status === 'voting' && (
                           <Button 
                            size="sm" 
                            className="h-8 bg-green-500 hover:bg-green-600"
                            onClick={() => handleLockIn(nom)}
                           >
                             <CheckCircle2 className="w-3 h-3 mr-2" /> Lock In
                           </Button>
                         )}
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
              {nominations?.length === 0 && (
                <div className="col-span-full py-20 glass border-white/5 rounded-3xl flex flex-col items-center justify-center text-white/20 italic">
                   <Film className="w-12 h-12 mb-4 opacity-10" />
                   <p>No nominations yet. Speak your mind.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Members & Status */}
        <div className="lg:col-span-4 space-y-12">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="bg-white/5">
              <CardTitle className="text-lg font-headline flex items-center gap-2 uppercase tracking-widest">
                <Users className="w-5 h-5 text-primary" /> Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <ScrollArea className="h-64">
                 <div className="p-6 space-y-4">
                   {members?.map(member => (
                     <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-white/10">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-white">{member.username}</p>
                            <p className="text-[10px] text-white/30">Joined {format(new Date(member.joinedAt), 'MMM d')}</p>
                          </div>
                        </div>
                        {member.userId === party.hostId && (
                          <Badge variant="outline" className="border-primary/30 text-primary text-[8px] uppercase font-bold">Host</Badge>
                        )}
                     </div>
                   ))}
                 </div>
               </ScrollArea>
            </CardContent>
          </Card>

          {party.selectedMovieId && (
            <Card className="glass border-primary/20 overflow-hidden animate-in zoom-in-95">
               <div className="aspect-[2/3] relative">
                 <Image src={party.selectedMoviePoster || ''} alt={party.selectedMovieTitle || ''} fill className="object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                 <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <Badge className="bg-primary text-white font-bold uppercase tracking-widest text-[10px]">FIXED FEATURE</Badge>
                    <h3 className="text-3xl font-headline font-bold text-white tracking-tighter uppercase">{party.selectedMovieTitle}</h3>
                    <Link href={`/watch-parties/${partyId}/room`}>
                      <Button className="w-full bg-white text-black hover:bg-white/90 h-12 font-bold uppercase tracking-widest">
                        <Play className="w-4 h-4 mr-2 fill-black" /> Watch Together
                      </Button>
                    </Link>
                 </div>
               </div>
            </Card>
          )}

          <div className="glass border-white/5 p-8 rounded-3xl space-y-4 text-center">
             <Share2 className="w-12 h-12 text-primary mx-auto opacity-50 mb-4" />
             <h4 className="text-lg font-headline text-white">Share the Room</h4>
             <p className="text-sm text-white/40">Invite your friends to this room by sharing the URL. Only members can vote!</p>
             <Button variant="outline" className="w-full glass border-white/10" onClick={copyInviteLink}>
               Copy Invite Link
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
