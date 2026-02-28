/**
 * Direct Google Sign-In using Google Identity Services (GIS) — renderButton approach.
 *
 * Uses renderButton() instead of prompt() to avoid FedCM issues.
 * renderButton opens a proper popup window that works on all browsers/mobile.
 *
 * Flow:
 *  1. Render a hidden Google sign-in button
 *  2. Programmatically click it → popup opens
 *  3. User picks Google account in the popup
 *  4. Google returns an ID token via callback
 *  5. We pass it to supabase.auth.signInWithIdToken()
 *
 * The browser NEVER needs to reach supabase.co directly.
 */
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID =
    "943749561226-vusudef46pb3eqjc1bq0n28febmv6v62.apps.googleusercontent.com";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        auto_select?: boolean;
                        cancel_on_tap_outside?: boolean;
                        use_fedcm_for_prompt?: boolean;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            type?: string;
                            theme?: string;
                            size?: string;
                            text?: string;
                            width?: number;
                        }
                    ) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

/**
 * Wait for the Google Identity Services library to load.
 */
function waitForGIS(timeoutMs = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }
        const start = Date.now();
        const check = setInterval(() => {
            if (window.google?.accounts?.id) {
                clearInterval(check);
                resolve();
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(check);
                reject(new Error("Google Sign-In failed to load. Please check your internet connection."));
            }
        }, 100);
    });
}

/**
 * Trigger Google Sign-In via a rendered button (popup, not FedCM).
 * Returns success/error for the caller to handle.
 */
export async function signInWithGoogleDirect(): Promise<{
    success: boolean;
    error?: string;
}> {
    await waitForGIS();

    return new Promise((resolve) => {
        // 30s timeout in case user closes popup without completing
        const timeout = setTimeout(() => {
            cleanup();
            resolve({ success: false, error: "Sign-in was cancelled or timed out." });
        }, 60000);

        // Create a hidden container for the Google button
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-9999px";
        container.style.left = "-9999px";
        container.style.opacity = "0.01";
        container.style.width = "300px";
        container.style.height = "50px";
        container.style.zIndex = "-1";
        document.body.appendChild(container);

        const cleanup = () => {
            clearTimeout(timeout);
            try {
                document.body.removeChild(container);
            } catch {
                // already removed
            }
        };

        // Initialize GIS with callback
        window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
                cleanup();
                try {
                    const { data, error } = await supabase.auth.signInWithIdToken({
                        provider: "google",
                        token: response.credential,
                    });

                    if (error) {
                        resolve({ success: false, error: error.message });
                        return;
                    }

                    if (!data.session) {
                        resolve({ success: false, error: "No session returned." });
                        return;
                    }

                    resolve({ success: true });
                } catch (err) {
                    resolve({
                        success: false,
                        error: err instanceof Error ? err.message : "Sign-in failed.",
                    });
                }
            },
            use_fedcm_for_prompt: false,
        });

        // Render the Google button in the hidden container
        window.google!.accounts.id.renderButton(container, {
            type: "standard",
            size: "large",
            text: "signin_with",
            width: 300,
        });

        // Wait a tick for the button iframe to render, then click it
        setTimeout(() => {
            const btn =
                container.querySelector<HTMLElement>("div[role='button']") ||
                container.querySelector<HTMLElement>("iframe");

            if (btn) {
                btn.click();
            } else {
                // If button didn't render, try the direct popup approach as fallback
                // Open Google OAuth in a popup window manually
                const width = 500;
                const height = 600;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                const nonce = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

                const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
                authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
                authUrl.searchParams.set("redirect_uri", `${window.location.origin}/auth/google-callback`);
                authUrl.searchParams.set("response_type", "id_token");
                authUrl.searchParams.set("scope", "openid email profile");
                authUrl.searchParams.set("nonce", nonce);
                authUrl.searchParams.set("prompt", "select_account");

                const popup = window.open(
                    authUrl.toString(),
                    "google_signin",
                    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
                );

                if (!popup) {
                    cleanup();
                    resolve({ success: false, error: "Popup was blocked. Please allow popups and try again." });
                    return;
                }

                // Poll for the popup to close or redirect back
                const pollInterval = setInterval(async () => {
                    try {
                        if (popup.closed) {
                            clearInterval(pollInterval);
                            cleanup();
                            resolve({ success: false, error: "Sign-in was cancelled." });
                            return;
                        }

                        // Check if popup navigated back to our origin
                        const popupUrl = popup.location?.href;
                        if (popupUrl && popupUrl.startsWith(window.location.origin)) {
                            clearInterval(pollInterval);
                            const hash = popup.location.hash;
                            popup.close();
                            cleanup();

                            // Extract id_token from hash
                            const params = new URLSearchParams(hash.replace("#", ""));
                            const idToken = params.get("id_token");

                            if (!idToken) {
                                resolve({ success: false, error: "No token received from Google." });
                                return;
                            }

                            const { data, error } = await supabase.auth.signInWithIdToken({
                                provider: "google",
                                token: idToken,
                            });

                            if (error) {
                                resolve({ success: false, error: error.message });
                            } else if (!data.session) {
                                resolve({ success: false, error: "No session returned." });
                            } else {
                                resolve({ success: true });
                            }
                        }
                    } catch {
                        // Cross-origin access error — popup is still on google.com, keep polling
                    }
                }, 500);
            }
        }, 200);
    });
}
