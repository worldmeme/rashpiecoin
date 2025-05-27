declare global {
  interface Window {
    eruda?: {
      init(): void;
      destroy(): void;
      _hide?(): void;
      // Tambahkan properti lain yang diketahui dari Eruda jika ada
      // Misalnya: get, show, config, dll. (lihat dokumentasi Eruda)
      get?(name: string): any; // Contoh properti dinamis
      [key: string]: unknown; // Gunakan 'unknown' sebagai alternatif 'any'
    };
  }
}