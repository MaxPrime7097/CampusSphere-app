import JSZip from "jszip";
import { MAX_RESOURCE_FILE_SIZE, MAX_RESOURCE_FILE_SIZE_LABEL } from "@/constants/resourceUpload";

export interface CompressFolderResult {
  zipFile: File;
  folderName: string;
  totalFiles: number;
}

const IGNORED_SYSTEM_FILES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
]);

/**
 * Compresse l'arborescence de fichiers d'un dossier sélectionné (via `<input webkitdirectory />`
 * ou drag & drop de dossier) en un fichier .zip unique côté client.
 */
export async function compressFolderToZip(
  files: FileList | File[],
  onProgress?: (percent: number, currentFile?: string) => void
): Promise<CompressFolderResult> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    throw new Error("Le dossier sélectionné est vide.");
  }

  // Déduire le nom du dossier racine à partir du premier chemin relatif
  let folderName = "Dossier";
  for (const f of fileArray) {
    const relPath = (f as any).webkitRelativePath as string | undefined;
    if (relPath && relPath.includes("/")) {
      const topSegment = relPath.split("/")[0].trim();
      if (topSegment) {
        folderName = topSegment;
        break;
      }
    }
  }

  const zip = new JSZip();
  let includedCount = 0;

  for (const file of fileArray) {
    const fileNameLower = file.name.toLowerCase();
    const relPath = (file as any).webkitRelativePath as string | undefined;

    // Ignorer les fichiers système polluants
    if (IGNORED_SYSTEM_FILES.has(fileNameLower) || (relPath && relPath.includes("__MACOSX"))) {
      continue;
    }

    // Préserver le chemin relatif à l'intérieur du dossier (ou le nom de fichier brut)
    let internalPath = file.name;
    if (relPath && relPath.startsWith(folderName + "/")) {
      internalPath = relPath.slice(folderName.length + 1);
    } else if (relPath) {
      internalPath = relPath;
    }

    if (!internalPath) {
      internalPath = file.name;
    }

    zip.file(internalPath, file);
    includedCount++;
  }

  if (includedCount === 0) {
    throw new Error("Aucun fichier valide à compresser dans ce dossier.");
  }

  const blob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent), metadata.currentFile ?? undefined);
      }
    }
  );

  if (blob.size > MAX_RESOURCE_FILE_SIZE) {
    throw new Error(
      `L'archive compressée (${(blob.size / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite autorisée de ${MAX_RESOURCE_FILE_SIZE_LABEL}.`
    );
  }

  const safeFileName = `${folderName.replace(/[\\/:*?"<>|]/g, "_")}.zip`;
  const zipFile = new File([blob], safeFileName, {
    type: "application/zip",
    lastModified: Date.now(),
  });

  return {
    zipFile,
    folderName,
    totalFiles: includedCount,
  };
}
