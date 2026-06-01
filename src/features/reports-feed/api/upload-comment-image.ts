import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const uploadCommentImage = async (file: File): Promise<string> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF.');
  }

  const fileExt = file.name.split('.').pop() ?? '';
  const fileName = `${crypto.randomUUID()}${fileExt ? '.' + fileExt : ''}`;
  const filePath = `comment-images/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('grievances').upload(filePath, file);

  if (uploadError) {
    if (uploadError.message?.includes('bucket')) {
      throw new Error(
        'Storage bucket "grievances" not found. Please create it in the Supabase dashboard.',
      );
    }
    if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
      throw new Error(
        'Upload permission denied. Check the storage RLS policies in the Supabase dashboard.',
      );
    }
    throw uploadError;
  }

  const { data } = supabase.storage.from('grievances').getPublicUrl(filePath);
  return data.publicUrl;
};
