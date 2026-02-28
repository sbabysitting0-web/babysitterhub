/**
 * Direct Google Sign-In using Google Identity Services (GIS).
 *
 * This completely bypasses the Supabase OAuth redirect flow, which is
 * blocked on mobile by carriers that filter connections to supabase.co.
 *
 * Flow:
 *  1. Google popup → user picks a Google account
 *  2. Google returns an ID token (JWT) directly to the browser
 *  3. We pass that token to supabase.auth.signInWithIdToken()
 *  4. Supabase validates it server-side and creates a session
 *
 * The browser NEVER needs to reach supabase.co directly — all Supabase
 * calls go through the Vercel proxy (/supabase/*).
 */
import { supabase } from "@/integrations/supabase/client";

// Google OAuth Client ID — same one registered in Supabase Dashboard
const GOOGLE_CLIENT_ID =
    "943749561226-vusudef46pb3eqjc1bq0n28febmv6v62.apps.googleusercontent.com";

// Extend window for GIS types
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
                    }) => void;
                    prompt: (notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
                };
            };
        };
    }
}

/**
 * Wait for the Google Identity Services library to load.
 * It's loaded async in index.html, so it may not be ready yet.
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
                reject(new Error("Google Sign-In library failed to load. Please check your internet connection."));
            }
        }, 100);
    });
}

/**
 * Trigger Google Sign-In popup and return a Supabase session.
 * Throws on failure (caller should catch and show a toast).
 */
export async function signInWithGoogleDirect(): Promise<{
    success: boolean;
    error?: string;
}> {
    await waitForGIS();

    return new Promise((resolve) => {
        window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
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
                        resolve({ success: false, error: "No session returned from Supabase." });
                        return;
                    }

                    resolve({ success: true });
                } catch (err) {
                    resolve({
                        success: false,
                        error: err instanceof Error ? err.message : "Sign-in failed. Please try again.",
                    });
                }
            },
            cancel_on_tap_outside: true,
        });

        // Trigger the One Tap / popup
        window.google!.accounts.id.prompt((notification) => {
            // If One Tap is not displayed (e.g. blocked by browser), 
            // we should not resolve with an error — the user just needs to try again
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback: use popup mode instead by triggering button click flow
                // For now, resolve with a user-friendly error
                resolve({
                    success: false,
                    error: "Google Sign-In popup was blocked. Please allow popups and try again.",
                });
            }
        });
    });
}
