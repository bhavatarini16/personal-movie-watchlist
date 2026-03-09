
"use client";

import { Movie, WatchlistEntry, Comment, SceneMemory } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar, Clock, Plus, Check, Trash2, Edit3, MessageSquare, Send, Lock, Bell, BellOff, Video, Quote, StickyNote } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore";
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
  
  // Scene Memory State
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [memoryTimestamp, setMemoryTimestamp] = useState("");
  const [memoryQuote, setMemoryQuote] = useState("");
  const [memoryNote, setMemoryNote] = useState("");

  const watchlistRef = useMemoFirebase(() => {
    if (!user?.uid || !movie?.tmdbId || !firestore || !isOpen) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("movieId", "==", movie.tmdbId)
    );
  }, [user?.uid, movie?.tmdbId, firestore, isOpen]);

  const { data: watchlistEntries } = useCollection<WatchlistEntry>(watchlistRef);
  const entry = watchlistEntries?.[0];

  const commentsRef = useMemoFirebase(() => {
    if (!isOpen || !movie?.tmdbId || !user?.uid || !firestore) return null;
    // Removed orderBy to avoid index requirement for initial dev
    return query(
      collection(firestore, `comments`),
      where("watchlistEntryId", "==", movie.tmdbId),
      limit(20)
    );
  }, [isOpen, movie?.tmdbId, user?.uid, firestore]);

  const { data: comments, isLoading: isCommentsLoading } = useCollection<Comment>(commentsRef);

  const sceneMemoriesRef = useMemoFirebase(() => {
    if (!isOpen || !movie?.tmdbId || !user?.uid || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/sceneMemories`),
      where("movieId", "==", movie.tmdbId),
      orderBy("addedDate", "desc")
    );
  }, [isOpen, movie?.tmdbId, user?.uid, firestore]);

  const { data: sceneMemories } = useCollection<SceneMemory>(sceneMemoriesRef);

  const isUpcoming = useMemo(() => {
    if (!movie?.releaseDate) return false;
    return new Date(movie.releaseDate) > new Date();
  }, [movie?.releaseDate]);

  if (!movie) return null;

  const handleToggleWatchlist = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required" });
      return;
    }

    if (entry) {
      deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id));
      toast({ title: "Removed from collection" });
    } else {
      addDocumentNonBlocking(collection(firestore, `users/${user.uid}/watchlist`), {
        userId: user.uid,
        movieId: movie.tmdbId,
        movieData: movie,
        addedDate: new Date().toISOString(),
        isWatched: false,
        rewatchCount: 0,
        remindMe: isUpcoming,
      });
      toast({ 
        title: isUpcoming ? "Reminder Set" : "Added to watchlist",
        description: isUpcoming ? `We'll notify you when "${movie.title}" releases.` : ""
      });
    }
  };

  const handleToggleReminder = () => {
    if (!user || !entry) return;
    const nextValue = !entry.remindMe;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      remindMe: nextValue
    });
    toast({ 
      title: nextValue ? "Reminder Activated" : "Reminder Silenced",
      description: nextValue ? `Pulse set for ${movie.releaseDate}` : "You won't receive release alerts for this film."
    });
  };

  const handleMarkAsWatched = () => {
    if (!user || !entry) return;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      isWatched: !entry.isWatched,
      watchDate: !entry.isWatched ? new Date().toISOString() : null,
      rewatchCount: !entry.isWatched ? (entry.rewatchCount || 0) + 1 : (entry.rewatchCount || 0),
      remindMe: false
    });
    toast({ title: entry.isWatched ? "Reset to unwatched" : "Marked as experienced" });
  };

  const handleSaveNotes = () => {
    if (!user || !entry) return;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      notes: tempNotes,
      personalRating: tempRating,
    });
    setEditingNotes(false);
    toast({ title: "Review saved" });
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
    toast({ title: "Comment posted" });
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
    toast({ title: "Scene Memory Saved", description: "This is now etched in your cinematic memory." });
  };

  const handleDeleteMemory = (memoryId: string) => {
    if (!user) return;
    deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/sceneMemories`, memoryId));
    toast({ title: "Memory deleted" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl glass-dark border-white/10 p-0 overflow-hidden text-white rounded-3xl">
        <ScrollArea className="max-h-[90vh]">
          <div className="relative h-72 md:h-[450px] w-full">
            <Image
              src={movie.backdropUrl || movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute bottom-10 left-8 right-8 flex flex-col md:flex-row items-end gap-10">
              <div className="relative w-40 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 shrink-0 transform hover:scale-105 transition-transform">
                <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <Badge key={g} variant="secondary" className="bg-primary/20 text-primary border-none font-bold uppercase tracking-wider text-[10px]">{g}</Badge>
                  ))}
                </div>
                <DialogTitle className="text-4xl md:text-7xl font-headline font-bold leading-[0.9] tracking-tighter uppercase">{movie.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-6 text-white/50 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Calendar className={cn("w-4 h-4", isUpcoming ? "text-blue-400" : "text-primary")} /> 
                    {movie.releaseDate} {isUpcoming && <Badge variant="outline" className="ml-2 border-blue-400/30 text-blue-400 text-[10px]">Upcoming</Badge>}
                  </span>
                  {movie.runtime && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {movie.runtime}m</span>}
                  <span className="flex items-center gap-2 text-primary font-bold"><Star className="w-4 h-4 fill-primary" /> {movie.tmdbRating} TMDB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary flex items-center gap-2 tracking-[0.4em] uppercase">
                  <Edit3 className="w-4 h-4" /> The Narrative
                </h4>
                <p className="text-white/70 leading-relaxed text-xl font-light">{movie.overview}</p>
              </div>

              {/* Scene Memory Feature Section */}
              <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-bold text-primary flex items-center gap-2 tracking-[0.4em] uppercase">
                    <Video className="w-4 h-4" /> Scene Memories
                   </h4>
                   {!isAddingMemory && user && (
                     <Button variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => setIsAddingMemory(true)}>
                       <Plus className="w-4 h-4 mr-2" /> Add Moment
                     </Button>
                   )}
                </div>

                {isAddingMemory && (
                  <Card className="glass border-primary/20 p-6 space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Timestamp</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            placeholder="e.g. 01:42:15" 
                            className="bg-white/5 border-white/10 pl-10 text-white"
                            value={memoryTimestamp}
                            onChange={(e) => setMemoryTimestamp(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Notable Quote</Label>
                        <div className="relative">
                          <Quote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <Input 
                            placeholder="What was said?" 
                            className="bg-white/5 border-white/10 pl-10 text-white"
                            value={memoryQuote}
                            onChange={(e) => setMemoryQuote(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Personal Note</Label>
                      <Textarea 
                        placeholder="Why is this scene etched in your mind?" 
                        className="bg-white/5 border-white/10 min-h-[80px] text-white"
                        value={memoryNote}
                        onChange={(e) => setMemoryNote(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1 bg-primary hover:bg-primary/80" onClick={handleSaveSceneMemory} disabled={!memoryTimestamp}>Etch in Memory</Button>
                      <Button variant="ghost" onClick={() => setIsAddingMemory(false)}>Cancel</Button>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {sceneMemories?.map(memory => (
                    <div key={memory.id} className="glass border-white/5 p-5 rounded-2xl group relative hover:border-white/20 transition-all">
                       <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDeleteMemory(memory.id)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                       <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                           <Clock className="text-primary w-5 h-5" />
                         </div>
                         <div className="space-y-3">
                            <div>
                              <span className="text-xs font-bold text-primary uppercase tracking-widest">Scene At {memory.timestamp}</span>
                              {memory.quote && (
                                <p className="text-lg font-headline italic text-white mt-1 leading-tight">"{memory.quote}"</p>
                              )}
                            </div>
                            {memory.note && (
                              <div className="flex gap-2 text-white/60 text-sm bg-white/5 p-3 rounded-lg border border-white/5 italic">
                                <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{memory.note}</p>
                              </div>
                            )}
                         </div>
                       </div>
                    </div>
                  ))}
                  {sceneMemories?.length === 0 && !isAddingMemory && (
                    <p className="text-center py-8 text-white/20 italic text-sm">No scene memories etched yet. Capture a moment!</p>
                  )}
                </div>
              </div>

              {entry && (
                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-primary tracking-[0.4em] uppercase">Your Perspective</h4>
                    {!editingNotes && (
                      <Button variant="outline" size="sm" className="glass border-white/10 rounded-xl" onClick={() => {
                        setTempNotes(entry.notes || "");
                        setTempRating(entry.personalRating || 0);
                        setEditingNotes(true);
                      }}>
                        Update Experience
                      </Button>
                    )}
                  </div>

                  {editingNotes ? (
                    <Card className="glass border-primary/20 p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Personal Rating</label>
                          <span className="text-primary font-bold text-lg">{tempRating}/10</span>
                        </div>
                        <Input 
                          type="range" 
                          min="0" max="10" step="0.5"
                          value={tempRating} 
                          onChange={(e) => setTempRating(Number(e.target.value))}
                          className="bg-transparent h-2"
                        />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Field Notes</label>
                        <Textarea 
                          value={tempNotes} 
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="What did you think of the cinematography, score, and pacing?"
                          className="bg-white/5 border-white/10 min-h-[140px] rounded-xl focus:ring-primary text-white"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button className="flex-1 bg-primary hover:bg-primary/80 h-12" onClick={handleSaveNotes}>Commit to Memory</Button>
                        <Button variant="ghost" className="h-12" onClick={() => setEditingNotes(false)}>Discard</Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
                      {entry.personalRating ? (
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-2xl">
                          <Star className="w-6 h-6 fill-yellow-500" /> {entry.personalRating}/10
                        </div>
                      ) : (
                        <p className="text-white/20 italic text-sm">No evaluation recorded yet.</p>
                      )}
                      <p className="text-white/80 text-lg leading-relaxed italic">"{entry.notes || "No notes added yet. Use the button above to record your thoughts."}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-10">
              <div className="space-y-4">
                <Button 
                  onClick={handleToggleWatchlist}
                  variant={entry ? "destructive" : "default"} 
                  className="w-full h-16 text-xl font-headline shadow-2xl rounded-2xl"
                >
                  {entry ? <Trash2 className="w-6 h-6 mr-3" /> : <Plus className="w-6 h-6 mr-3" />}
                  {entry ? "Purge" : (isUpcoming ? "Set Reminder" : "Track Film")}
                </Button>
                {entry && (
                  <div className="space-y-2">
                    <Button 
                      variant="secondary" 
                      className="w-full h-16 glass border-white/10 rounded-2xl text-lg font-headline"
                      onClick={handleMarkAsWatched}
                    >
                      {entry.isWatched ? <Check className="w-6 h-6 mr-3 text-green-500" /> : <Clock className="w-6 h-6 mr-3" />}
                      {entry.isWatched ? `Watched (${entry.rewatchCount || 1}x)` : "Mark Experienced"}
                    </Button>
                    
                    {isUpcoming && (
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full h-12 glass border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                          entry.remindMe ? "text-blue-400 border-blue-400/20 bg-blue-400/5" : "text-white/40"
                        )}
                        onClick={handleToggleReminder}
                      >
                        {entry.remindMe ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                        {entry.remindMe ? "Reminder Active" : "Set Release Reminder"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-10 border-t border-white/5">
                 <h4 className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Social Pulse
                 </h4>
                 
                 {user ? (
                   <>
                     <ScrollArea className="h-64 pr-4">
                       <div className="space-y-6">
                         {comments?.map(comment => (
                           <div key={comment.id} className="flex gap-3 group">
                             <Avatar className="w-8 h-8 shrink-0">
                               <AvatarImage src={comment.avatarUrl} />
                               <AvatarFallback>{comment.username?.[0] || 'U'}</AvatarFallback>
                             </Avatar>
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                 <span className="text-xs font-bold text-white">{comment.username}</span>
                                 <span className="text-[10px] text-white/30">{new Date(comment.commentDate).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm text-white/70">{comment.text}</p>
                             </div>
                           </div>
                         ))}
                         {!isCommentsLoading && (comments?.length === 0 || !comments) && <p className="text-center py-10 text-white/20 italic text-sm">Silence in the theater. Be the first to speak.</p>}
                         {isCommentsLoading && <p className="text-center py-10 text-white/20 italic text-sm">Loading insights...</p>}
                       </div>
                     </ScrollArea>

                     <div className="relative pt-4">
                       <Input 
                         placeholder="Share your insight..." 
                         className="bg-white/5 border-white/10 pr-12 h-12 rounded-xl text-white"
                         value={commentText}
                         onChange={(e) => setCommentText(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                       />
                       <Button 
                         size="icon" 
                         className="absolute right-1 top-[1.25rem] h-10 w-10 bg-primary hover:bg-primary/80 rounded-lg"
                         onClick={handlePostComment}
                         disabled={!commentText.trim()}
                       >
                         <Send className="w-4 h-4" />
                       </Button>
                     </div>
                   </>
                 ) : (
                   <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <Lock className="w-8 h-8 text-white/20" />
                      <p className="text-sm text-white/50">Join the discussion by signing in to your account.</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
