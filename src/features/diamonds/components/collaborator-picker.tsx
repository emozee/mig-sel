import { useState, useRef, useEffect } from 'react';
import { Search, X, UserPlus, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface CollaboratorEntry {
  id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
}

interface CollaboratorPickerProps {
  selected: { id: string; name: string }[];
  onAdd: (user: { id: string; name: string }) => void;
  onRemove: (userId: string) => void;
}

export const CollaboratorPicker = ({ selected, onAdd, onRemove }: CollaboratorPickerProps) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const {
    data: results,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['search-user-for-collab', search],
    enabled: search.trim().length >= 2,
    staleTime: 30_000,
    queryFn: async (): Promise<CollaboratorEntry[]> => {
      const { data, error } = await supabase.rpc('search_profiles', {
        search_query: search.trim(),
      });

      if (error) throw error;
      const currentSelected = selectedRef.current;
      const selectedSet = new Set(currentSelected.map((s) => s.id));
      return ((data ?? []) as CollaboratorEntry[]).filter((u) => !selectedSet.has(u.id));
    },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium transition-colors"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Volunteers
      </button>

      {open && (
        <div className="border-border mt-2 rounded-lg border bg-white">
          <div className="border-border flex items-center gap-1.5 border-b px-2 py-1.5">
            <Search className="text-muted-foreground h-3.5 w-3.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="placeholder:text-muted-foreground/50 flex-1 bg-transparent text-xs outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch('');
              }}
              className="text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Selected collaborators */}
          {selected.length > 0 && (
            <div className="border-border flex flex-wrap gap-1.5 border-b px-2 py-1.5">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                >
                  {u.name}
                  <button
                    type="button"
                    onClick={() => onRemove(u.id)}
                    className="hover:text-red-500"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {search.trim().length < 2 ? (
              <p className="text-muted-foreground/50 p-3 text-center text-[10px]">
                Type at least 2 characters to search
              </p>
            ) : isFetching ? (
              <p className="text-muted-foreground p-3 text-center text-xs">Searching...</p>
            ) : error ? (
              <div className="flex flex-col items-center gap-1 p-3 text-center">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-xs text-red-500">Search failed</p>
              </div>
            ) : !results?.length ? (
              <p className="text-muted-foreground/50 p-3 text-center text-xs">No users found</p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() =>
                    onAdd({ id: u.id, name: u.username ?? u.email.split('@')[0] ?? 'Unknown' })
                  }
                  className="flex w-full items-center gap-2.5 border-b border-gray-50 px-3 py-2.5 text-left text-xs transition-colors last:border-0 hover:bg-gray-50"
                >
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.username ?? 'User avatar'}
                      loading="lazy"
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
                      {(u.username ?? u.email[0] ?? '?').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground truncate font-medium">
                      {u.username ?? u.email.split('@')[0] ?? 'Unknown'}
                    </div>
                  </div>
                  <Users className="text-muted-foreground/40 ml-auto h-3.5 w-3.5 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
