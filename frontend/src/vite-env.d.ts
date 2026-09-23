/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ADMIN_PANEL_V2?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-icons/*';
declare module 'react-icons/fa';
declare module 'react-icons/fc';
