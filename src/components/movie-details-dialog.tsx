
"use client";

import { Movie, WatchlistEntry, Comment } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Clock, User, Plus, Check, Trash2, Edit3, MessageSquare, Send, Lock } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

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

  const watchlistRef = useMemoFirebase(() => {
    if (!user || !movie || !firestore || !isOpen) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("movieId", "==", movie.tmdbId)
    );
  }, [user?.uid, movie?.tmdbId, firestore, isOpen]);

  const { data: watchlistEntries } = useCollection<WatchlistEntry>(watchlistRef);
  const entry = watchlistEntries?.[0];

  const commentsRef = useMemoFirebase(() => {
    // CRITICAL: Only attempt to fetch comments if the dialog is OPEN, the movie is valid, and a user is signed in
    if (!isOpen || !movie?.tmdbId || !user?.uid || !firestore) return null;
    return query(
      collection(firestore, `comments`),
      where("watchlistEntryId", "==", movie.tmdbId),
      // Temporarily removing orderBy to avoid composite index requirements during development
      // orderBy("commentDate", "desc"),
      limit(20)
    );
  }, [isOpen, movie?.tmdbId, user?.uid, firestore]);

  const { data: comments, isLoading: isCommentsLoading } = useCollection<Comment>(commentsRef);

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
      });
      toast({ title: "Added to watchlist" });
    }
  };

  const handleMarkAsWatched = () => {
    if (!user || !entry) return;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      isWatched: !entry.isWatched,
      watchDate: !entry.isWatched ? new Date().toISOString() : null,
      rewatchCount: entry.isWatched ? (entry.rewatchCount || 0) + 1 : (entry.rewatchCount || 0)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl glass-dark border-white/10 p-0 overflow-hidden text-white rounded-3xl">
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
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {movie.releaseDate}</span>
                {movie.runtime && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {movie.runtime}m</span>}
                <span className="flex items-center gap-2 text-primary font-bold"><Star className="w-4 h-4 fill-primary" /> {movie.tmdbRating} TMDB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-y-auto max-h-[55vh]">
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-primary flex items-center gap-2 tracking-[0.4em] uppercase">
                <Edit3 className="w-4 h-4" /> The Narrative
              </h4>
              <p className="text-white/70 leading-relaxed text-xl font-light">{movie.overview}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="space-y-1">
                 <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Director</p>
                 <p className="text-sm font-semibold text-white">{movie.director}</p>
               </div>
               <div className="col-span-3 space-y-1">
                 <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Principal Cast</p>
                 <p className="text-sm font-semibold text-white">{movie.cast?.join(", ")}</p>
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
                        className="bg-white/5 border-white/10 min-h-[140px] rounded-xl focus:ring-primary"
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
                    {entry.watchDate && (
                      <p className="text-[10px] text-white/30 uppercase tracking-widest pt-4">Experienced on {new Date(entry.watchDate).toLocaleDateString()}</p>
                    )}
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
                {entry ? "Purge" : "Track Film"}
              </Button>
              {entry && (
                <Button 
                  variant="secondary" 
                  className="w-full h-16 glass border-white/10 rounded-2xl text-lg font-headline"
                  onClick={handleMarkAsWatched}
                >
                  {entry.isWatched ? <Check className="w-6 h-6 mr-3 text-green-500" /> : <Clock className="w-6 h-6 mr-3" />}
                  {entry.isWatched ? `Watched (${entry.rewatchCount || 1}x)` : "Mark Experienced"}
                </Button>
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
                             <AvatarFallback>{comment.username[0]}</AvatarFallback>
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
                       className="bg-white/5 border-white/10 pr-12 h-12 rounded-xl"
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
      </DialogContent>
    </Dialog>
  );
}
