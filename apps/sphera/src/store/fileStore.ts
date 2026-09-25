export let pendingUploadFile: File | null = null;

export const setPendingUploadFile = (file: File | null) => {
  pendingUploadFile = file;
};
