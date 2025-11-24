import React from "react";

type LoadingProps = {
  message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Chargement..." }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/90"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-t-blue-600 rounded-full animate-spin border-gray-200 dark:border-gray-700" />
        <div className="text-gray-700 dark:text-gray-200 text-lg">{message}</div>
      </div>
    </div>
  );
};

export default Loading;
