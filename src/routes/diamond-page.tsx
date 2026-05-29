import { useNavigate } from 'react-router';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { DiamondCreator } from '@/features/diamonds/components/diamond-creator';
import { DiamondFeed } from '@/features/diamonds/components/diamond-feed';
import { MapDock } from '@/components/layout/map-dock';

export const DiamondPage = () => {
  const navigate = useNavigate();

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
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <h1 className="text-base font-bold text-gray-900">Diamond</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-3 pt-3 pb-24">
        <DiamondCreator />
        <DiamondFeed />
      </div>

      <MapDock />
    </div>
  );
};
