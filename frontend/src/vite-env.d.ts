/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_SHEET_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}