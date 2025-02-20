import crypto from "crypto-js";

export function generateSignature(data: any): string {
  const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY || "";
  const jsonString = JSON.stringify(data);
  return crypto.HmacSHA256(jsonString, secretKey).toString();
}
