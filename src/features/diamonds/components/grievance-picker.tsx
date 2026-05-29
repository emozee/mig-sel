import { useState } from 'react';
import { Search, X, Link2, AlertCircle, ImageIcon } from 'lucide-react';
import { useUserGrievances } from '../api/use-user-grievances';

interface GrievancePickerProps {
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}

export const GrievancePicker = ({ selectedId, onSelect }: GrievancePickerProps) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { data: grievances, isFetching } = useUserGrievances(search);

  const items = grievances ?? [];

  if (selectedId) {
    const selected = items.find((g) => g.id === selectedId);
    if (selected) {
      return (
        <div className="border-primary/20 bg-primary/5 flex items-center gap-2 rounded-lg border px-3 py-2">
          {selected.image_url ? (
            <img
              src={selected.image_url}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-cover"
            />
          ) : (
            <ImageIcon className="text-primary/60 h-4 w-4 shrink-0" />
          )}
          <div className="text-primary min-w-0 flex-1 truncate text-xs font-medium">
            {selected.title}
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(undefined);
              setSearch('');
            }}
            className="text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-red-100 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      );
    }
  }

  return open ? (
    <div className="border-border rounded-lg border bg-white">
      <div className="border-border flex items-center gap-1.5 border-b px-2 py-1.5">
        <Search className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your active issues..."
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

      <div className="max-h-48 overflow-y-auto">
        {isFetching ? (
          <p className="text-muted-foreground p-3 text-center text-xs">Loading...</p>
        ) : !items.length ? (
          <div className="flex flex-col items-center gap-1 p-4 text-center">
            <AlertCircle className="text-muted-foreground/40 h-5 w-5" />
            <p className="text-muted-foreground/60 text-xs">
              {search ? 'No matching issues' : 'No active issues to link'}
            </p>
          </div>
        ) : (
          items.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                onSelect(g.id);
                setOpen(false);
                setSearch('');
              }}
              className="flex w-full items-center gap-2.5 border-b border-gray-50 px-3 py-2.5 text-left text-xs transition-colors last:border-0 hover:bg-gray-50"
            >
              {g.image_url ? (
                <img
                  src={g.image_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="text-muted-foreground/50 h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-foreground truncate font-medium">{g.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      g.status === 'in-progress' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                  />
                  <span className="text-muted-foreground/60 text-[10px] capitalize">
                    {g.status === 'in-progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium transition-colors"
    >
      <Link2 className="h-3.5 w-3.5" />
      Link to an Issue
    </button>
  );
};
