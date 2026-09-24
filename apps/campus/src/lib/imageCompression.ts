import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file for uploading, converting it to WebP.
 * Keeps non-image files (or SVGs/GIFs) untouched.
 */
export async function compressImageFile(file: File, options?: {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const defaultOptions = {
    maxSizeMB: 1, 
    maxWidthOrHeight: 1920, 
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  };

  try {
    const compressedBlob = await imageCompression(file, { ...defaultOptions, ...options });
    
    let newName = file.name;
    if (defaultOptions.fileType === 'image/webp') {
      newName = newName.replace(/\.[^/.]+$/, "") + ".webp";
    }

    return new File([compressedBlob], newName, {
      type: defaultOptions.fileType || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression error:", error);
    return file;
  }
}

export async function compressImageFiles(files: File[] | FileList): Promise<File[]> {
  const fileArray = Array.from(files);
  const compressedFiles = await Promise.all(fileArray.map(file => compressImageFile(file)));
  return compressedFiles;
}
