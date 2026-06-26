import { supabase } from '@/lib/supabase';
import { optimizeStorageUrl } from '@/lib/images';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const uploadDiamondImages = async (files: File[]): Promise<string[]> => {
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File "${file.name}" has an invalid type. Allowed: JPEG, PNG, WebP, GIF.`);
    }
  }

  const uploads = files.map(async (file) => {
    const fileExt = file.name.split('.').pop() ?? '';
    const fileName = `${crypto.randomUUID()}${fileExt ? '.' + fileExt : ''}`;
    const filePath = `diamond-images/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('diamonds').upload(filePath, file);

    if (uploadError) {
      if (uploadError.message?.includes('bucket')) {
        throw new Error(
          'Storage bucket "diamonds" not found. Please create it in the Supabase dashboard.',
        );
      }
      if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
        throw new Error(
          'Upload permission denied. Check the storage RLS policies in the Supabase dashboard.',
        );
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from('diamonds').getPublicUrl(filePath);
    return optimizeStorageUrl(data.publicUrl, 'diamonds');
  });

  return Promise.all(uploads);
};
