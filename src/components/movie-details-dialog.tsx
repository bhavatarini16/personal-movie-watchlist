
"use client";

import { Movie, WatchlistEntry, Comment, SceneMemory, UserProfile, GamificationStats } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Calendar, Clock, Plus, Check, Trash2, Edit3, MessageSquare, Send, Lock, Bell, BellOff, Video, Quote, StickyNote } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, limit, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";

interface MovieDetailsDialogProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieDetailsDialog({ movie, isOpen, onClose }: MovieDetailsDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [tempRating, setTempRating] = useState<number>(0);
  const [commentText, setCommentText] = useState("");
  
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [memoryTimestamp, setMemoryTimestamp] = useState("");
  const [memoryQuote, setMemoryQuote] = useState("");
  const [memoryNote, setMemoryNote] = useState("");

  const watchlistDocRef = useMemoFirebase(() => {
    if (!user?.uid || !movie?.tmdbId || !firestore) return null;
    return doc(firestore, `users/${user.uid}/watchlist/${movie.tmdbId}`);
  }, [user?.uid, movie?.tmdbId, firestore]);

  const { data: entry } = useDoc<WatchlistEntry>(watchlistDocRef);

  const commentsRef = useMemoFirebase(() => {
    if (!isOpen || !movie?.tmdbId || !firestore) return null;
    return query(
      collection(firestore, `comments`),
      where("watchlistEntryId", "==", movie.tmdbId),
      limit(20)
    );
  }, [isOpen, movie?.tmdbId, firestore]);

  const { data: comments, isLoading: isCommentsLoading } = useCollection<Comment>(commentsRef);

  const sceneMemoriesRef = useMemoFirebase(() => {
    if (!isOpen || !movie?.tmdbId || !user?.uid || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/sceneMemories`),
      where("movieId", "==", movie.tmdbId)
    );
  }, [isOpen, movie?.tmdbId, user?.uid, firestore]);

  const { data: sceneMemories } = useCollection<SceneMemory>(sceneMemoriesRef);

  const isUpcoming = useMemo(() => {
    if (!movie?.releaseDate) return false;
    return new Date(movie.releaseDate) > new Date();
  }, [movie?.releaseDate]);

  if (!movie) return null;

  const updateGamification = async () => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data() as UserProfile;
    const stats: GamificationStats = userData.gamification || {
      streak: 0,
      lastWatchDate: null,
      badges: [],
      totalWatched: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = stats.lastWatchDate ? new Date(stats.lastWatchDate) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    let newStreak = stats.streak;
    if (!lastDate) {
      newStreak = 1;
    } else {
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const newTotal = stats.totalWatched + 1;
    const newBadges = [...stats.badges];
    
    if (newTotal === 1 && !newBadges.includes("Cinematic Rookie")) newBadges.push("Cinematic Rookie");
    if (newStreak === 3 && !newBadges.includes("Streak Starter")) newBadges.push("Streak Starter");
    if (today.getDay() >= 5 && !newBadges.includes("Weekend Binger")) newBadges.push("Weekend Binger");

    updateDocumentNonBlocking(userRef, {
      gamification: {
        streak: newStreak,
        lastWatchDate: today.toISOString(),
        badges: newBadges,
        totalWatched: newTotal
      }
    });
  };

  const handleToggleWatchlist = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required" });
      return;
    }

    if (entry) {
      deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id));
      toast({ title: "Removed from collection" });
    } else {
      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist/${movie.tmdbId}`), {
        id: movie.tmdbId,
        userId: user.uid,
        movieId: movie.tmdbId,
        movieData: movie,
        addedDate: new Date().toISOString(),
        isWatched: false,
        rewatchCount: 0,
        remindMe: isUpcoming,
        isFavorite: false
      }, { merge: true });
      toast({ title: isUpcoming ? "Reminder Set" : "Added to watchlist" });
    }
  };

  const handleMarkAsWatched = () => {
    if (!user || !entry) return;
    const newlyWatched = !entry.isWatched;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      isWatched: newlyWatched,
      watchDate: newlyWatched ? new Date().toISOString() : null,
      rewatchCount: newlyWatched ? (entry.rewatchCount || 0) + 1 : (entry.rewatchCount || 0),
      remindMe: false
    });
    
    if (newlyWatched) {
      updateGamification();
      toast({ title: "Achievement! Marked as experienced." });
    } else {
      toast({ title: "Reset to unwatched" });
    }
  };

  const handleSaveNotes = () => {
    if (!user || !entry) return;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      notes: tempNotes,
      personalRating: tempRating,
    });
    setEditingNotes(false);
    toast({ title: "Perspective saved" });
  };

  const handlePostComment = () => {
    if (!user || !commentText.trim()) return;
    addDocumentNonBlocking(collection(firestore, `comments`), {
      userId: user.uid,
      username: user.email?.split('@')[0] || "Anonymous",
      avatarUrl: `https://picsum.photos/seed/${user.uid}/100`,
      watchlistEntryId: movie.tmdbId,
      text: commentText,
      commentDate: new Date().toISOString(),
    });
    setCommentText("");
    toast({ title: "Comment shared" });
  };

  const handleSaveSceneMemory = () => {
    if (!user || !memoryTimestamp.trim()) return;
    addDocumentNonBlocking(collection(firestore, `users/${user.uid}/sceneMemories`), {
      userId: user.uid,
      movieId: movie.tmdbId,
      movieTitle: movie.title,
      posterUrl: movie.posterUrl,
      timestamp: memoryTimestamp,
      quote: memoryQuote,
      note: memoryNote,
      addedDate: new Date().toISOString(),
    });
    setMemoryTimestamp("");
    setMemoryQuote("");
    setMemoryNote("");
    setIsAddingMemory(false);
    toast({ title: "Scene memory etched" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl glass-dark border-white/10 p-0 overflow-hidden text-white rounded-3xl">
        <ScrollArea className="max-h-[90vh]">
          <div className="relative h-72 md:h-[400px] w-full">
            <Image
              src={movie.backdropUrl || movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-10 left-8 right-8 flex flex-col md:flex-row items-end gap-10">
              <div className="relative w-40 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
                <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <Badge key={g} variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] uppercase font-bold">{g}</Badge>
                  ))}
                </div>
                <DialogTitle className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-tighter">{movie.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-6 text-white/50 text-sm">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {movie.releaseDate}</span>
                  {movie.runtime && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {movie.runtime}m</span>}
                  <span className="flex items-center gap-2 text-primary font-bold"><Star className="w-4 h-4 fill-primary" /> {movie.tmdbRating}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary flex items-center gap-2 tracking-[0.4em] uppercase">Narrative Overview</h4>
                <p className="text-white/70 leading-relaxed text-xl font-light italic">{movie.overview}</p>
              </div>

              <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-bold text-primary flex items-center gap-2 tracking-[0.4em] uppercase">Cinematic Moments</h4>
                   {!isAddingMemory && user && (
                     <Button variant="ghost" className="text-primary" onClick={() => setIsAddingMemory(true)}>
                       <Plus className="w-4 h-4 mr-2" /> Etch Scene
                     </Button>
                   )}
                </div>

                {isAddingMemory && (
                  <Card className="glass border-primary/20 p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Timestamp (e.g. 1:12:45)" className="bg-white/5 border-white/10" value={memoryTimestamp} onChange={e => setMemoryTimestamp(e.target.value)} />
                      <Input placeholder="Key Quote" className="bg-white/5 border-white/10" value={memoryQuote} onChange={e => setMemoryQuote(e.target.value)} />
                    </div>
                    <Textarea placeholder="Contextual Note" className="bg-white/5 border-white/10" value={memoryNote} onChange={e => setMemoryNote(e.target.value)} />
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-primary" onClick={handleSaveSceneMemory}>Save Moment</Button>
                      <Button variant="ghost" onClick={() => setIsAddingMemory(false)}>Cancel</Button>
                    </div>
                  </Card>
                )}

                <div className="space-y-4">
                  {sceneMemories?.map(m => (
                    <div key={m.id} className="glass border-white/5 p-4 rounded-xl flex items-start gap-4">
                       <div className="p-2 bg-primary/10 rounded-lg"><Video className="w-4 h-4 text-primary" /></div>
                       <div>
                         <p className="text-xs font-bold text-white/40">AT {m.timestamp}</p>
                         <p className="text-lg font-headline italic text-white my-1">"{m.quote}"</p>
                         <p className="text-sm text-white/50">{m.note}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-3">
                <Button onClick={handleToggleWatchlist} variant={entry ? "destructive" : "default"} className="w-full h-14 text-lg font-headline">
                  {entry ? "Purge from Ledger" : (isUpcoming ? "Set Pulse Reminder" : "Track in Ledger")}
                </Button>
                {entry && (
                  <Button variant="secondary" className="w-full h-14 glass border-white/10" onClick={handleMarkAsWatched}>
                    {entry.isWatched ? "Reset Experience" : "Mark as Experienced"}
                  </Button>
                )}
              </div>

              {entry && (
                <div className="glass border-white/5 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Personal Pulse</h4>
                    <Button variant="ghost" size="sm" onClick={() => { setTempNotes(entry.notes || ""); setTempRating(entry.personalRating || 0); setEditingNotes(true); }}><Edit3 className="w-3 h-3" /></Button>
                  </div>
                  {editingNotes ? (
                    <div className="space-y-4">
                      <Input type="number" min="0" max="10" step="0.5" value={tempRating} onChange={e => setTempRating(Number(e.target.value))} className="bg-white/5" />
                      <Textarea value={tempNotes} onChange={e => setTempNotes(e.target.value)} className="bg-white/5" />
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-primary" onClick={handleSaveNotes}>Commit</Button>
                        <Button variant="ghost" onClick={() => setEditingNotes(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                       {entry.personalRating ? <div className="flex items-center gap-2 text-yellow-500 font-bold"><Star className="w-4 h-4 fill-yellow-500" /> {entry.personalRating}/10</div> : <p className="text-xs italic text-white/20">No rating given</p>}
                       <p className="text-sm text-white/70 italic">"{entry.notes || "No notes recorded."}"</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-white/5">
                <ScrollArea className="h-48">
                   {comments?.map(c => (
                     <div key={c.id} className="flex gap-3 mb-4">
                       <Avatar className="w-6 h-6"><AvatarFallback>{c.username[0]}</AvatarFallback></Avatar>
                       <div>
                         <p className="text-[10px] font-bold text-white/40">{c.username}</p>
                         <p className="text-xs text-white/80">{c.text}</p>
                       </div>
                     </div>
                   ))}
                </ScrollArea>
                <div className="flex gap-2">
                  <Input placeholder="Add your perspective..." value={commentText} onChange={e => setCommentText(e.target.value)} className="bg-white/5 border-white/10" />
                  <Button size="icon" onClick={handlePostComment} disabled={!commentText.trim()}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
