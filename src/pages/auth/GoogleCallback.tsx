/**
 * Handles the Google OAuth popup callback.
 * This page is loaded inside a popup window — it just exists so the popup
 * can redirect back to our domain with the id_token in the URL hash.
 * The parent window polls for this and extracts the token.
 */
const GoogleCallback = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#080F0D" }}
    >
      <span
        className="w-8 h-8 rounded-full border-4 animate-spin"
        style={{ borderColor: "rgba(61,190,181,0.2)", borderTopColor: "#3DBEB5" }}
      />
      <p className="text-white/50 text-sm">Completing sign-in…</p>
    </div>
  );
};

export default GoogleCallback;
