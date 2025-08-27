import crypto from "crypto";

const algorithm = "aes-256-cbc";
const secret = process.env.ENCRYPTION_SECRET!;
const ivLength = 16;

export function formatSecret(str: string): string {
  const [, aux] = str.split("|"); // ignora parte inicial se vier "auth0|..."
  let response = aux + secret;
  return response.slice(0, 32); // corta se passar de 32
}

export function encrypt(text: string, secret: string): string {
  const str = formatSecret(secret);
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(str), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string, secret: string): string {
  const str = formatSecret(secret);
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(str), iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString();
}
