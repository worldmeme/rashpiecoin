declare global {
  interface Window {
    ethereum?: import('viem').Eip1193Provider | undefined;
  }
}