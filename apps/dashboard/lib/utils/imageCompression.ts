import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

const defaultOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip compression for small files (< 500KB)
  if (file.size < 500 * 1024) {
    return file;
  }

  const compressionOptions = {
    ...defaultOptions,
    ...(options?.maxSizeMB && { maxSizeMB: options.maxSizeMB }),
    ...(options?.maxWidthOrHeight && { maxWidthOrHeight: options.maxWidthOrHeight }),
  };

  try {
    const compressed = await imageCompression(file, compressionOptions);
    return new File([compressed], file.name, { type: compressed.type });
  } catch {
    // If compression fails, return original file
    return file;
  }
}
