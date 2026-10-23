import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsSuperAdmin } from '@/features/auth/api/use-is-super-admin';
import { useRevertResolution } from '../api/use-revert-resolution';

interface ResolutionRevertControlProps {
  complaintId: string;
  imageUrl: string | null;
}

export const ResolutionRevertControl = ({
  complaintId,
  imageUrl,
}: ResolutionRevertControlProps) => {
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const revertResolution = useRevertResolution();
  const [open, setOpen] = useState(false);

  if (!isSuperAdmin) return null;

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" />
        Revert Resolution
      </Button>

      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Revert this resolution?</DialogTitle>
          <DialogDescription>
            The report will return to In Progress, the after photo will be deleted, and the
            reporter's resolved points will be reversed.
          </DialogDescription>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={revertResolution.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={revertResolution.isPending}
              onClick={() =>
                revertResolution.mutate(
                  { id: complaintId, imageUrl },
                  { onSuccess: () => setOpen(false) },
                )
              }
            >
              {revertResolution.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {revertResolution.isPending ? 'Reverting...' : 'Confirm Revert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
