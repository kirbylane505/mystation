import dynamic from "next/dynamic";

// Vault is PIN-gated and most visitors never reach it. Dynamic-load the
// real client bundle so /vault itself ships only the shell.
const VaultPageClient = dynamic(() => import("./VaultPageClient"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Unlocking the vault...
    </div>
  ),
});

export default function VaultPage() {
  return <VaultPageClient />;
}
