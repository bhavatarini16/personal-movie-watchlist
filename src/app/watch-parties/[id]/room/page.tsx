'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { WatchParty, WatchPartyMember } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  Users, 
  Maximize2, 
  MessageCircle,
  Play,
  Volume2,
  Tv
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function WatchRoomPage() {
  const params = useParams();
  const partyId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Core Data
  const partyRef = useMemoFirebase(() => doc(firestore, 'watchParties', partyId), [firestore, partyId]);
  const { data: party, isLoading: isPartyLoading } = useDoc<WatchParty>(partyRef);

  const membersRef = useMemoFirebase(() => collection(firestore, `watchParties/${partyId}/members`), [firestore, partyId]);
  const { data: members } = useCollection<WatchPartyMember>(membersRef);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to participate in the watch party room.',
        });
      }
    };

    if (user) {
      getCameraPermission();
    }

    return () => {
      // Cleanup stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user, toast]);

  const toggleMic = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  if (isPartyLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-16 px-6 glass-dark border-b border-white/5 flex items-center justify-between shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => router.back()}>
            <PhoneOff className="w-5 h-5 mr-2 text-red-500" /> Leave Room
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <h1 className="text-lg font-headline font-bold text-white uppercase tracking-tighter line-clamp-1">
              {party?.selectedMovieTitle || 'Cinematic Experience'}
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Live Watch Session • {party?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border-none">LIVE SYNC</Badge>
          <div className="flex items-center gap-1 text-white/60">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">{members?.length || 1}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Cinema Area */}
        <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black p-4">
          <div className="relative w-full aspect-video max-h-[85vh] rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/5 group">
             {/* Mock Movie Player */}
             <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                   <Tv className="w-20 h-20 text-white/10 mx-auto" />
                   <p className="text-white/20 font-headline uppercase tracking-widest text-lg">Buffering Sync Stream...</p>
                </div>
                {/* Simulated Movie Background */}
                <img 
                  src={party?.selectedMoviePoster || 'https://picsum.photos/seed/cinema/1920/1080'} 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110" 
                  alt="background"
                />
             </div>

             {/* Player Controls Overlay (Visible on Hover) */}
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
               <div className="space-y-6">
                 <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-primary w-1/3" />
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Button size="icon" variant="ghost" className="text-white hover:text-primary">
                        <Play className="w-8 h-8 fill-white" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-white">
                        <Volume2 className="w-6 h-6" />
                      </Button>
                      <span className="text-sm font-bold text-white/60">01:12:45 / 02:45:00</span>
                    </div>
                    <Button size="icon" variant="ghost" className="text-white">
                      <Maximize2 className="w-6 h-6" />
                    </Button>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Participant Sidebar */}
        <div className="w-80 glass-dark border-l border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
             <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
               <MessageCircle className="w-4 h-4 text-primary" /> Comm-Link
             </h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Local User Participant */}
              <div className="space-y-2">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-primary/30 group">
                  <video 
                    ref={videoRef} 
                    className={cn(
                      "w-full h-full object-cover mirror-mode",
                      !isVideoEnabled && "hidden"
                    )} 
                    autoPlay 
                    muted 
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Avatar className="w-16 h-16 border-2 border-white/10">
                         <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100`} />
                         <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                       </Avatar>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <Badge className="bg-black/60 backdrop-blur-md text-[10px] border-none font-bold">YOU (Host)</Badge>
                    <div className="flex gap-1">
                      {!isMicEnabled && <MicOff className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>
                </div>

                {!hasCameraPermission && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 p-2">
                    <AlertTitle className="text-[10px] font-bold uppercase">Permissions Required</AlertTitle>
                    <AlertDescription className="text-[10px]">
                      Enable camera/mic for audio-visual sync.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Other Participants (Mocked for UI visualization) */}
              {members?.filter(m => m.userId !== user?.uid).map((member, idx) => (
                <div key={member.id} className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="w-12 h-12 border border-white/10">
                         <AvatarImage src={member.avatarUrl} />
                         <AvatarFallback>{member.username[0]}</AvatarFallback>
                      </Avatar>
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-2 left-2 flex items-center gap-2">
                     <Badge className="bg-black/40 text-[10px] border-none">{member.username}</Badge>
                     {idx === 0 && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                   </div>
                </div>
              ))}
              
              {(!members || members.length <= 1) && (
                <div className="py-10 text-center space-y-2 opacity-20">
                   <Users className="w-8 h-8 mx-auto" />
                   <p className="text-[10px] uppercase font-bold tracking-widest">Waiting for friends...</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Controls Footer */}
          <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-center gap-4">
             <Button 
                size="icon" 
                variant={isMicEnabled ? "secondary" : "destructive"} 
                className="rounded-full w-12 h-12 glass border-white/10"
                onClick={toggleMic}
              >
               {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
             </Button>
             <Button 
                size="icon" 
                variant={isVideoEnabled ? "secondary" : "destructive"} 
                className="rounded-full w-12 h-12 glass border-white/10"
                onClick={toggleVideo}
              >
               {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
             </Button>
             <Button 
                size="icon" 
                variant="destructive" 
                className="rounded-full w-12 h-12 shadow-2xl shadow-red-500/20"
                onClick={() => router.back()}
              >
               <PhoneOff className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mirror-mode {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
