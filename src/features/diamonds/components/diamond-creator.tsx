import { useState, useRef, useCallback, useEffect } from 'react';
import { Image, X, Loader2, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
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
  const { user } = useCurrentUser();
  const userInitials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ??
    user?.email?.[0]?.toUpperCase() ??
    '?';
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
    <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {userInitials}
        </div>
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a facet of your day at GMC..."
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-400"
            rows={2}
            maxLength={1000}
          />
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 px-4">
          {previews.map((src, i) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-lg">
              <img
                src={src}
                alt={'Upload preview ' + (i + 1)}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              <Image className="h-4 w-4" />
              Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <span className="text-gray-300">|</span>
            <GrievancePicker selectedId={linkedGrievanceId} onSelect={setLinkedGrievanceId} />
          </div>

          <button
            type="button"
            onClick={handlePost}
            disabled={!canPost}
            className={cn(
              'relative flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold transition-all',
              postStatus === 'idle' && canPost && 'bg-primary hover:bg-primary/90 text-white',
              postStatus === 'idle' && !canPost && 'cursor-not-allowed bg-gray-100 text-gray-400',
              postStatus === 'pending' && 'bg-primary/80 cursor-wait text-white',
              postStatus === 'success' && 'bg-primary text-white',
            )}
          >
            {postStatus === 'idle' && 'Post'}
            {postStatus === 'pending' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Posting...
              </>
            )}
            {postStatus === 'success' && (
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4" /> Posted!
              </span>
            )}
          </button>
        </div>

        {linkedGrievanceId && (
          <div className="pt-3">
            <CollaboratorPicker
              selected={collaborators}
              onAdd={(u) => setCollaborators((prev) => [...prev, u])}
              onRemove={(id) => setCollaborators((prev) => prev.filter((c) => c.id !== id))}
            />
            <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
              <Sparkles className="h-3 w-3" />
              Direct Solve — uploader gets 4 pts, volunteer(s) get 10 pts each upon admin acceptance
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
