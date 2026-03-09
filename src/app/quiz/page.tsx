
"use client";

import { useState } from 'react';
import { cinemaPersonalityQuiz, CinemaPersonalityQuizOutput } from '@/ai/flows/cinema-personality-quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Sparkles, Loader2, RefreshCw, Save, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What's your preferred cinematic pace?",
    options: [
      "High-octane adrenaline (Action-packed)",
      "Slow-burn tension (Atmospheric)",
      "Methodical and intellectual (Thoughtful)",
      "Breezy and light (Easy-going)"
    ]
  },
  {
    id: 2,
    question: "How do you like your movie endings?",
    options: [
      "Tied up with a neat bow (Closure)",
      "Open to interpretation (Ambiguous)",
      "Heart-wrenchingly emotional (Tragic)",
      "A shocking twist I never saw coming"
    ]
  },
  {
    id: 3,
    question: "What visual style speaks to you most?",
    options: [
      "Grounded, raw and realistic",
      "Vibrant, neon and highly stylized",
      "Grand, epic and CGI-heavy",
      "Noir-inspired shadows and grit"
    ]
  },
  {
    id: 4,
    question: "Where should the story's focus be?",
    options: [
      "Deep character study and psychology",
      "Intricate plot twists and mysteries",
      "Rich world-building and lore",
      "Relatable everyday life situations"
    ]
  },
  {
    id: 5,
    question: "What's your ideal movie setting?",
    options: [
      "A futuristic dystopian city",
      "The gritty streets of a modern metropolis",
      "A lush, historical period landscape",
      "A completely imaginary fantasy realm"
    ]
  },
  {
    id: 6,
    question: "Which type of conflict is most engaging?",
    options: [
      "Man vs. Man (Heroes vs. Villains)",
      "Man vs. Self (Internal struggles)",
      "Man vs. Society (Rebellion/Politics)",
      "Man vs. Nature/Fate (Survival)"
    ]
  },
  {
    id: 7,
    question: "How important is the soundtrack?",
    options: [
      "It should be front and center (Epic scores)",
      "Subtle and atmospheric (Background mood)",
      "I prefer silence and natural sound",
      "Licensed pop/rock hits only"
    ]
  },
  {
    id: 8,
    question: "What do you seek when you watch a movie?",
    options: [
      "Intellectual challenge and philosophy",
      "Pure escapism and entertainment",
      "A deep emotional release (Crying/Joy)",
      "Social commentary and relevance"
    ]
  },
  {
    id: 9,
    question: "Which cinematic era draws you in?",
    options: [
      "Modern blockbuster spectacles",
      "Indie A24-style experimental films",
      "Classic Hollywood Golden Age",
      "World/International cinema"
    ]
  },
  {
    id: 10,
    question: "How do you prefer to experience a film?",
    options: [
      "Analyzing every frame for hidden meaning",
      "Turning off my brain and enjoying the ride",
      "Feeling every emotion with the characters",
      "Discussing the social implications after"
    ]
  }
];

export default function QuizPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<CinemaPersonalityQuizOutput | null>(null);

  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentStep]: option }));
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    }
  };

  const handleCompleteQuiz = async () => {
    setLoading(true);
    try {
      const formattedAnswers = QUIZ_QUESTIONS.map(q => ({
        question: q.question,
        answer: answers[q.id - 1]
      }));

      const output = await cinemaPersonalityQuiz({ answers: formattedAnswers });
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
    setAnswers({});
    setCurrentStep(0);
  };

  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="pt-24 min-h-screen max-w-4xl mx-auto px-4 md:px-8 pb-16 overflow-hidden">
      <div className="text-center space-y-4 mb-8 animate-fade-in">
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight">CINEMA <span className="text-gradient">IDENTITY</span></h1>
        <p className="text-white/60 text-lg">Uncover your cinematic persona through our interactive identity engine.</p>
      </div>

      {!result ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <span>Question {currentStep + 1} of {QUIZ_QUESTIONS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-1 bg-white/5" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              <Card className="glass border-white/5 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
                <CardHeader className="pt-10 pb-6">
                  <CardTitle className="text-2xl md:text-3xl text-white font-headline leading-tight">
                    {QUIZ_QUESTIONS[currentStep].question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-10 px-8">
                  {QUIZ_QUESTIONS[currentStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${
                        answers[currentStep] === option 
                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(255,77,77,0.2)]' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                          answers[currentStep] === option ? 'bg-primary border-primary' : 'border-white/20 bg-black/40'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-lg font-medium">{option}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </CardContent>
                <CardFooter className="bg-black/20 flex justify-between p-6">
                  <Button 
                    variant="ghost" 
                    className="text-white/40 hover:text-white"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                  </Button>
                  
                  {currentStep === QUIZ_QUESTIONS.length - 1 ? (
                    <Button 
                      className="bg-primary hover:bg-primary/80 px-8 font-headline"
                      disabled={loading || !answers[currentStep]}
                      onClick={handleCompleteQuiz}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Finalize Identity
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="text-white/40 hover:text-white"
                      disabled={!answers[currentStep]}
                      onClick={() => setCurrentStep(prev => prev + 1)}
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="animate-in zoom-in-95 duration-500"
        >
          <Card className="glass border-primary/20 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary/20 text-primary border-primary/20 text-xs font-bold uppercase tracking-widest">Identity Confirmed</Badge>
            </div>
            <CardHeader className="text-center pt-16 pb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl shadow-primary/20 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                <Sparkles className="text-primary w-12 h-12 relative z-10" />
              </div>
              <CardTitle className="text-5xl font-headline text-white mb-2 tracking-tighter">{result.personalityType}</CardTitle>
              <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
            </CardHeader>
            <CardContent className="px-10 text-center pb-10">
              <p className="text-white/80 text-xl leading-relaxed italic font-light">
                "{result.description}"
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-8 bg-black/40">
              <Button 
                className="w-full bg-primary hover:bg-primary/80 h-14 text-lg font-bold shadow-xl shadow-primary/20" 
                onClick={handleSaveToProfile}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Integrate with My Profile
              </Button>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="secondary" className="glass border-white/10 h-12" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Recalibrate
                </Button>
                <Link href="/profile" className="w-full">
                  <Button variant="outline" className="w-full glass border-white/10 h-12">View Pulse</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
