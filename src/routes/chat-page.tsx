import { ArrowLeft, Bot } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { MapDock } from '@/components/layout/map-dock';
import { AskMigselChat } from '@/features/chatbot/components/ask-migsel-chat';

export const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <header className="border-border shrink-0 border-b bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-xl items-center gap-3 px-3">
          <Button variant="ghost" size="icon-xs" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Ask MIGSEL</h1>
            <p className="text-xs text-slate-500">Not sure where to go? Just ask.</p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col bg-slate-50 pb-20">
        <AskMigselChat />
      </main>
      <MapDock />
    </div>
  );
};
