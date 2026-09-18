export interface EncryptionService {
  encrypt(text: string): string;
  decrypt(cipher: string): string;
}
