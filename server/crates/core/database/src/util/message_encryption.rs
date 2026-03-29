use aes_gcm::{
    aead::{Aead, AeadCore, OsRng},
    Aes256Gcm, Key, KeyInit, Nonce,
};
use base64::{prelude::BASE64_STANDARD, Engine};
use once_cell::sync::OnceCell;

/// Prefix for encrypted content — used to distinguish encrypted from plaintext
const ENC_PREFIX: &str = "$enc$";

/// Global cipher instance, initialized once at startup
static CIPHER: OnceCell<Aes256Gcm> = OnceCell::new();

/// Whether encryption is enabled (key was provided)
static ENABLED: OnceCell<bool> = OnceCell::new();

/// Initialize the message encryption cipher from config.
/// Must be called once at server startup.
pub fn init_cipher(encryption_key: &str) {
    let enabled = !encryption_key.is_empty();
    ENABLED.set(enabled).ok();

    if enabled {
        let key_bytes = BASE64_STANDARD
            .decode(encryption_key)
            .expect("messages.encryption_key must be valid base64");

        assert_eq!(
            key_bytes.len(),
            32,
            "messages.encryption_key must be exactly 32 bytes (256 bits)"
        );

        let key: &Key<Aes256Gcm> = key_bytes.as_slice().into();
        let cipher = Aes256Gcm::new(key);
        CIPHER.set(cipher).ok();

        log::info!("Message encryption enabled (AES-256-GCM)");
    } else {
        log::warn!("Message encryption is DISABLED — messages stored in plaintext");
    }
}

/// Returns true if message encryption is enabled
pub fn is_enabled() -> bool {
    ENABLED.get().copied().unwrap_or(false)
}

/// Encrypt message content. Returns the original string if encryption is disabled.
/// Format: "$enc$" + base64(nonce_12_bytes + ciphertext)
pub fn encrypt_content(plaintext: &str) -> String {
    if !is_enabled() {
        return plaintext.to_string();
    }

    let cipher = CIPHER.get().expect("cipher not initialized");
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .expect("message encryption failed");

    // nonce (12 bytes) + ciphertext concatenated, then base64
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);

    format!("{}{}", ENC_PREFIX, BASE64_STANDARD.encode(&combined))
}

/// Decrypt message content. Returns as-is if not encrypted (backward compat).
pub fn decrypt_content(stored: &str) -> String {
    if !stored.starts_with(ENC_PREFIX) {
        // Plaintext message (pre-encryption or encryption disabled)
        return stored.to_string();
    }

    let cipher = match CIPHER.get() {
        Some(c) => c,
        None => {
            log::error!("Encrypted message found but cipher not initialized");
            return stored.to_string();
        }
    };

    let encoded = &stored[ENC_PREFIX.len()..];
    let combined = match BASE64_STANDARD.decode(encoded) {
        Ok(bytes) => bytes,
        Err(e) => {
            log::error!("Failed to decode encrypted message base64: {e}");
            return stored.to_string();
        }
    };

    if combined.len() < 12 {
        log::error!("Encrypted message too short (< 12 bytes nonce)");
        return stored.to_string();
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce: &Nonce<typenum::consts::U12> = nonce_bytes.into();

    match cipher.decrypt(nonce, ciphertext) {
        Ok(plaintext) => String::from_utf8_lossy(&plaintext).to_string(),
        Err(e) => {
            log::error!("Message decryption failed: {e}");
            stored.to_string()
        }
    }
}

/// Encrypt an Option<String> content field
pub fn encrypt_option(content: &Option<String>) -> Option<String> {
    content.as_ref().map(|c| encrypt_content(c))
}

/// Decrypt an Option<String> content field
pub fn decrypt_option(content: &Option<String>) -> Option<String> {
    content.as_ref().map(|c| decrypt_content(c))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_cipher() {
        // Reset for tests - use a test key
        let key_b64 = "V4iSgJodgQJFcv8wFOJ7AQwT1WaD3zx6I8uIP6TZds4=";
        let key_bytes = BASE64_STANDARD.decode(key_b64).unwrap();
        let key: &Key<Aes256Gcm> = key_bytes.as_slice().into();
        let cipher = Aes256Gcm::new(key);
        // For tests, we need to handle OnceCell already being set
        let _ = CIPHER.set(cipher);
        let _ = ENABLED.set(true);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        setup_test_cipher();

        let original = "Hello, world! Привет, мир! 🎉";
        let encrypted = encrypt_content(original);

        assert!(encrypted.starts_with(ENC_PREFIX));
        assert_ne!(encrypted, original);

        let decrypted = decrypt_content(&encrypted);
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_plaintext_passthrough() {
        setup_test_cipher();

        let plaintext = "This is a plaintext message";
        let result = decrypt_content(plaintext);
        assert_eq!(result, plaintext);
    }

    #[test]
    fn test_empty_string() {
        setup_test_cipher();

        let encrypted = encrypt_content("");
        let decrypted = decrypt_content(&encrypted);
        assert_eq!(decrypted, "");
    }

    #[test]
    fn test_option_helpers() {
        setup_test_cipher();

        let none: Option<String> = None;
        assert_eq!(encrypt_option(&none), None);
        assert_eq!(decrypt_option(&none), None);

        let some = Some("test message".to_string());
        let encrypted = encrypt_option(&some);
        assert!(encrypted.is_some());
        let decrypted = decrypt_option(&encrypted);
        assert_eq!(decrypted, some);
    }
}
