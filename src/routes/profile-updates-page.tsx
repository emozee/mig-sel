import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { DiamondPost } from '@/features/diamonds/components/diamond-post';
import { useMyDiamonds } from '@/features/diamonds/api/use-my-diamonds';

export const ProfileUpdatesPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useMyDiamonds();
  const items = data?.items ?? [];

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-bold">My Updates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {items.length} {items.length === 1 ? 'post' : 'posts'} published
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card shadow-card flex flex-col items-center justify-center rounded-xl border px-6 py-16">
            <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
              <Sparkles className="text-muted-foreground/50 h-7 w-7" />
            </div>
            <p className="text-foreground text-sm font-semibold">No updates yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Share your first update from the diamond page
            </p>
            <Button onClick={() => navigate('/diamond')} size="sm" className="mt-4 font-bold">
              Go to Diamond
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((post, i) => (
              <DiamondPost key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
