import { useState, useRef, useCallback, useEffect } from 'react';
import { Image, X, Loader2, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateDiamond } from '../api/use-create-diamond';
import { GrievancePicker } from './grievance-picker';
import { CollaboratorPicker } from './collaborator-picker';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type PostStatus = 'idle' | 'pending' | 'success';

export const DiamondCreator = () => {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [postStatus, setPostStatus] = useState<PostStatus>('idle');
  const [linkedGrievanceId, setLinkedGrievanceId] = useState<string | undefined>();
  const [collaborators, setCollaborators] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const { mutateAsync: createDiamond } = useCreateDiamond();

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(f.type));
    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    previewUrlsRef.current = [...previewUrlsRef.current, ...newPreviews];
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(previews[index]);
      previewUrlsRef.current = previewUrlsRef.current.filter((_, i) => i !== index);
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [previews],
  );

  const handlePost = useCallback(async () => {
    if (!body.trim() || postStatus !== 'idle') return;
    setPostStatus('pending');
    try {
      await createDiamond({
        body: body.trim(),
        files,
        linkedGrievanceId,
        collaboratorIds: collaborators.length > 0 ? collaborators.map((c) => c.id) : undefined,
      });
      setPostStatus('success');
      setTimeout(() => {
        setPostStatus('idle');
        setBody('');
        setLinkedGrievanceId(undefined);
        setCollaborators([]);
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = [];
        setFiles([]);
        setPreviews([]);
      }, 2000);
    } catch {
      setPostStatus('idle');
    }
  }, [body, files, linkedGrievanceId, collaborators, postStatus, createDiamond]);

  const canPost = body.trim().length > 0 && postStatus === 'idle';

  return (
    <div className="shadow-card rounded-2xl border border-white/30 bg-white/60 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="text-primary/60 h-4 w-4" />
        <span className="text-muted-foreground/80 text-xs font-semibold tracking-wide">
          Diamond
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a facet of your day at GMC..."
        className="text-foreground placeholder-muted-foreground/40 w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
        rows={3}
        maxLength={1000}
      />

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-lg">
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="bg-muted/80 text-muted-foreground absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 hover:shadow-md"
              >
                <X className="h-3.5 w-3.5 transition-transform hover:scale-110" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Image className="h-4 w-4" />
              Add Photos
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <span className="text-muted-foreground/30">|</span>

            <GrievancePicker selectedId={linkedGrievanceId} onSelect={setLinkedGrievanceId} />
          </div>

          <button
            type="button"
            onClick={handlePost}
            disabled={!canPost}
            className={cn(
              'relative flex items-center gap-1.5 overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              postStatus === 'idle' &&
                canPost &&
                'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]',
              postStatus === 'idle' &&
                !canPost &&
                'bg-muted text-muted-foreground cursor-not-allowed',
              postStatus === 'pending' && 'bg-primary/80 text-primary-foreground cursor-wait',
              postStatus === 'success' &&
                'scale-105 bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
            )}
          >
            {postStatus === 'idle' && 'Add Facet'}
            {postStatus === 'pending' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Posting...
              </>
            )}
            {postStatus === 'success' && (
              <span className="animate-bounce-slow inline-flex items-center gap-1">
                <Check className="h-4 w-4" />
                Posted!
              </span>
            )}
          </button>
        </div>

        {linkedGrievanceId && (
          <div className="space-y-1.5 pt-1">
            <CollaboratorPicker
              selected={collaborators}
              onAdd={(u) => setCollaborators((prev) => [...prev, u])}
              onRemove={(id) => setCollaborators((prev) => prev.filter((c) => c.id !== id))}
            />
            <p className="text-primary/70 flex items-center gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" />
              Direct Solve — uploader gets 4 pts, volunteer(s) get 10 pts each upon admin acceptance
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
