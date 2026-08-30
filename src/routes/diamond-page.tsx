import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Gem, X } from 'lucide-react';
import { DiamondCreator } from '@/features/diamonds/components/diamond-creator';
import { DiamondFeed } from '@/features/diamonds/components/diamond-feed';
import { AnnouncementsBanner } from '@/features/announcements/components/announcements-banner';
import { MapDock } from '@/components/layout/map-dock';
import { FloatingChat } from '@/features/chatbot/components/floating-chat';

export const DiamondPage = () => {
  const navigate = useNavigate();
  const [showGuidelines, setShowGuidelines] = useState(true);

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Gem className="text-primary h-5 w-5" />
          <h1 className="text-base font-bold text-gray-900">Diamond</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-3 pt-3 pb-24">
        <AnnouncementsBanner />
        <DiamondCreator />

        {showGuidelines && (
          <div className="bg-primary/[0.06] overflow-hidden rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="relative pl-1">
              <div className="bg-primary absolute top-0 left-0 h-full w-1 rounded-l-xl" />
              <div className="relative px-4 py-3.5 pr-10">
                <button
                  type="button"
                  onClick={() => setShowGuidelines(false)}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-start gap-2.5">
                  <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <Gem className="text-primary h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-800">Community Guidelines</p>
                    <p className="text-[11px] leading-relaxed text-gray-600">
                      Share your happiest moments and best experiences at GMC! Please keep posts
                      respectful — no sensitive, defamatory, or inappropriate content. Let's build a
                      positive space together.
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className="inline-block h-1 w-1 rounded-full bg-gray-300" />
                      Posts that violate these guidelines may be removed by admins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DiamondFeed />
      </div>

      <div className="fixed right-4 bottom-24 z-40">
        <FloatingChat />
      </div>

      <MapDock />
    </div>
  );
};
