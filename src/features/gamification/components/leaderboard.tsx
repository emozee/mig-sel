import { Crown, Loader2, User, TrendingUp } from 'lucide-react';
import { useLeaderboard } from '@/features/gamification/api/use-leaderboard';
import { useSession } from '@/features/auth/api/use-session';

const Avatar = ({
  url,
  username,
  className = '',
}: {
  url: string | null;
  username: string | null;
  className?: string;
}) => {
  if (url) {
    return (
      <img
        src={url}
        alt={username ?? 'Avatar'}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  const initials = (username ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (initials) {
    return (
      <div
        className={`from-muted to-muted/80 text-muted-foreground flex items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`bg-muted flex items-center justify-center rounded-full ${className}`}>
      <User className="text-muted-foreground h-5 w-5" />
    </div>
  );
};

const MEDAL_CONFIG: Record<number, { ring: string; badge: string; bg: string; label: string }> = {
  1: {
    ring: 'ring-primary',
    badge: 'bg-primary text-primary-foreground',
    bg: 'from-primary to-chart-1',
    label: '1st',
  },
  2: {
    ring: 'ring-gray-300',
    badge: 'bg-gray-300 text-gray-700',
    bg: 'from-gray-200 to-gray-400',
    label: '2nd',
  },
  3: {
    ring: 'ring-chart-4',
    badge: 'bg-chart-4 text-chart-1',
    bg: 'from-chart-4 to-secondary',
    label: '3rd',
  },
};

const PodiumEntry = ({
  entry,
  currentUserId,
}: {
  entry: {
    id: string;
    rank: number;
    avatar_url: string | null;
    username: string | null;
    points: number;
  };
  currentUserId: string | undefined;
}) => {
  const config = MEDAL_CONFIG[entry.rank];
  const isFirst = entry.rank === 1;
  const isSecond = entry.rank === 2;
  const avatarSize = isFirst ? 'h-20 w-20' : isSecond ? 'h-16 w-16' : 'h-12 w-12';
  const verticalOffset = isFirst ? 'pt-0' : isSecond ? 'pt-8' : 'pt-16';
  const order = isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${order} ${verticalOffset}`}>
      <div className="relative">
        <Avatar
          url={entry.avatar_url}
          username={entry.username}
          className={`${avatarSize} ring-2 ${config.ring} shadow-lg`}
        />
        {isFirst ? (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Crown className="text-primary h-5 w-5 drop-shadow-sm" />
          </div>
        ) : (
          <div
            className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-sm ring-2 ring-white ${config.badge}`}
          >
            {entry.rank}
          </div>
        )}
      </div>
      <p
        className={`max-w-[100px] truncate text-center font-bold ${isFirst ? 'text-base' : 'text-sm'}`}
      >
        {entry.username ?? 'Anonymous'}
      </p>
      <div className={`flex items-baseline gap-0.5 rounded-full ${config.bg} px-2.5 py-0.5`}>
        <span className="text-xs font-black text-white">{entry.points}</span>
        <span className="text-[10px] font-semibold text-white/80">pts</span>
      </div>
      {entry.id === currentUserId && (
        <p className="text-primary -mt-0.5 text-[10px] font-semibold">You</p>
      )}
    </div>
  );
};

const Podium = ({
  entries,
  currentUserId,
}: {
  entries: Array<{
    id: string;
    rank: number;
    avatar_url: string | null;
    username: string | null;
    points: number;
  }>;
  currentUserId: string | undefined;
}) => {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => a.rank - b.rank);

  return (
    <div className="flex items-start justify-center gap-6">
      {sorted.map((entry) => (
        <PodiumEntry key={entry.id} entry={entry} currentUserId={currentUserId} />
      ))}
    </div>
  );
};

const LeaderboardRow = ({
  entry,
  currentUserId,
}: {
  entry: {
    id: string;
    rank: number;
    avatar_url: string | null;
    username: string | null;
    points: number;
  };
  currentUserId: string | undefined;
}) => (
  <div
    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
      entry.id === currentUserId
        ? 'from-primary/5 to-primary/10 ring-primary/30 bg-gradient-to-r ring-2'
        : 'bg-card ring-border hover:ring-foreground/10 ring-1'
    }`}
  >
    <Avatar
      url={entry.avatar_url}
      username={entry.username}
      className="ring-background h-9 w-9 shrink-0 shadow-sm ring-2"
    />
    <div className="min-w-0 flex-1">
      <p className="text-foreground truncate text-sm font-bold">{entry.username ?? 'Anonymous'}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-foreground text-sm font-black">{entry.points}</span>
        <span className="text-muted-foreground text-[10px] font-semibold">
          {entry.points === 1 ? 'pt' : 'pts'}
        </span>
      </div>
    </div>
    <div className="from-muted to-muted/80 text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold">
      {entry.rank}
    </div>
  </div>
);

const YourRankCard = ({
  entry,
  currentUserId,
}: {
  entry: {
    id: string;
    rank: number;
    avatar_url: string | null;
    username: string | null;
    points: number;
  };
  currentUserId: string | undefined;
}) => (
  <div className="border-primary/20 from-primary/[0.04] to-primary/[0.08] rounded-xl border bg-gradient-to-r p-4">
    <div className="mb-2.5 flex items-center gap-2">
      <div className="bg-primary/20 flex h-5 w-5 items-center justify-center rounded-full">
        <span className="text-primary text-[11px] font-black">!</span>
      </div>
      <p className="text-primary text-xs font-bold tracking-wider uppercase">Your Rank</p>
    </div>
    <LeaderboardRow entry={entry} currentUserId={currentUserId} />
  </div>
);

export const Leaderboard = () => {
  const { data: entries, isLoading, isError, error } = useLeaderboard();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          Failed to load leaderboard: {error?.message}
        </p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="from-muted to-muted/50 mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br">
          <TrendingUp className="text-muted-foreground h-10 w-10" />
        </div>
        <p className="text-foreground text-lg font-bold">No points earned yet</p>
        <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">
          Submit complaints and get them acknowledged to earn points and climb the ranks!
        </p>
      </div>
    );
  }

  const topThree = entries.slice(0, 3);
  const listEntries = entries.slice(3, 8);
  const currentUserEntry = entries.find((e) => e.id === currentUserId);
  const isUserInTop8 = currentUserEntry && currentUserEntry.rank <= 8;

  return (
    <div className="space-y-5">
      <Podium entries={topThree} currentUserId={currentUserId} />

      {currentUserEntry && !isUserInTop8 && (
        <YourRankCard entry={currentUserEntry} currentUserId={currentUserId} />
      )}

      {listEntries.length > 0 && (
        <div className="space-y-1.5">
          {listEntries.map((entry) => (
            <LeaderboardRow key={entry.id} entry={entry} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
};
