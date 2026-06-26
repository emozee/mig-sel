import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { DiamondPost } from '@/features/diamonds/components/diamond-post';
import { useMyDiamonds } from '@/features/diamonds/api/use-my-diamonds';

const PAGE_SIZE = 6;

export const ProfileUpdatesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyDiamonds(page, PAGE_SIZE);
  const items = data?.items ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-bold">My Updates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} {total === 1 ? 'post' : 'posts'} published
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
          <>
            <div className="space-y-4">
              {items.map((post, i) => (
                <DiamondPost key={post.id} post={post} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-[36px]"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
