import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Leaderboard } from '@/features/gamification/components/leaderboard';

export const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900">Leaderboard</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Top contributors ranked by points earned from complaints
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};
