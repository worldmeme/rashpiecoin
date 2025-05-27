declare global {
  interface Window {
    eruda?: {
      init(): void;
      destroy(): void;
      _hide?(): void;
      [key: string]: any;
    };
  }
}