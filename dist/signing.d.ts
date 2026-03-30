/**
 * Ed25519 Signing Utilities for A2A Message Security (SDK)
 *
 * Mirrors the API's signing.ts but for client-side use.
 * Uses Node.js built-in crypto — zero external dependencies.
 *
 * Usage:
 *   import { signPayload, verifySignature } from "@shareabot/sdk/signing";
 *
 *   const signature = signPayload(myJsonPayload, myPrivateKeyBase64);
 *   // Send with header: X-Signature: <signature>
 */
/**
 * Sign a JSON payload with an Ed25519 private key.
 * The payload is canonicalized (sorted keys) before signing.
 *
 * @param payload - The JSON object to sign (the JSON-RPC body, without _directory)
 * @param privateKeyBase64 - Base64-encoded Ed25519 private key (PKCS8 DER), from registration
 * @returns Base64-encoded signature string (use as X-Signature header)
 */
export declare function signPayload(payload: unknown, privateKeyBase64: string): string;
/**
 * Verify an Ed25519 signature against a JSON payload.
 *
 * @param payload - The JSON object that was signed
 * @param signatureBase64 - Base64-encoded signature to verify
 * @param publicKeyBase64 - Base64-encoded Ed25519 public key (SPKI DER)
 * @returns true if valid
 */
export declare function verifySignature(payload: unknown, signatureBase64: string, publicKeyBase64: string): boolean;
//# sourceMappingURL=signing.d.ts.map