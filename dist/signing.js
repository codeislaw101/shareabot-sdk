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
import crypto from "node:crypto";
/**
 * Sign a JSON payload with an Ed25519 private key.
 * The payload is canonicalized (sorted keys) before signing.
 *
 * @param payload - The JSON object to sign (the JSON-RPC body, without _directory)
 * @param privateKeyBase64 - Base64-encoded Ed25519 private key (PKCS8 DER), from registration
 * @returns Base64-encoded signature string (use as X-Signature header)
 */
export function signPayload(payload, privateKeyBase64) {
    const canonical = canonicalize(payload);
    const key = crypto.createPrivateKey({
        key: Buffer.from(privateKeyBase64, "base64"),
        format: "der",
        type: "pkcs8",
    });
    const signature = crypto.sign(null, Buffer.from(canonical, "utf8"), key);
    return signature.toString("base64");
}
/**
 * Verify an Ed25519 signature against a JSON payload.
 *
 * @param payload - The JSON object that was signed
 * @param signatureBase64 - Base64-encoded signature to verify
 * @param publicKeyBase64 - Base64-encoded Ed25519 public key (SPKI DER)
 * @returns true if valid
 */
export function verifySignature(payload, signatureBase64, publicKeyBase64) {
    try {
        const canonical = canonicalize(payload);
        const key = crypto.createPublicKey({
            key: Buffer.from(publicKeyBase64, "base64"),
            format: "der",
            type: "spki",
        });
        return crypto.verify(null, Buffer.from(canonical, "utf8"), key, Buffer.from(signatureBase64, "base64"));
    }
    catch {
        return false;
    }
}
/**
 * Canonicalize a JSON value: sorted keys, no whitespace, deterministic output.
 */
function canonicalize(value) {
    if (value === null || value === undefined)
        return "null";
    if (typeof value === "boolean" || typeof value === "number")
        return JSON.stringify(value);
    if (typeof value === "string")
        return JSON.stringify(value);
    if (Array.isArray(value)) {
        return "[" + value.map(canonicalize).join(",") + "]";
    }
    if (typeof value === "object") {
        const obj = value;
        const keys = Object.keys(obj).sort();
        const entries = keys
            .filter((k) => obj[k] !== undefined)
            .map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k]));
        return "{" + entries.join(",") + "}";
    }
    return JSON.stringify(value);
}
//# sourceMappingURL=signing.js.map