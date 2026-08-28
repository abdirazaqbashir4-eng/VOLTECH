import Link from "next/link";
import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
import SettingsToggle from "@/components/SettingsToggle";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div>
      {/* Profile Summary Card */}
      <div className="bg-surface-container-lowest p-margin-mobile flex items-center gap-stack-md border border-outline-variant rounded-lg mb-stack-lg shadow-sm">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
        </div>
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{session.user.name}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{session.user.email}</p>
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-stack-lg">
        {/* Notifications */}
        <section className="mb-stack-md md:mb-0">
          <div className="px-1 py-stack-sm">
            <h3 className="font-label-lg text-label-lg text-secondary uppercase tracking-wider">Notifications</h3>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
            <SettingsRow icon="notifications_active" title="Push Notifications" subtitle="Order updates and alerts">
              <SettingsToggle id="toggle-push" defaultChecked />
            </SettingsRow>
            <SettingsRow icon="mail" title="Email Digest" subtitle="Weekly summaries and offers">
              <SettingsToggle id="toggle-email" />
            </SettingsRow>
            <SettingsRow icon="sms" title="SMS Alerts" subtitle="Critical delivery updates" last>
              <SettingsToggle id="toggle-sms" defaultChecked />
            </SettingsRow>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="mb-stack-md md:mb-0">
          <div className="px-1 py-stack-sm">
            <h3 className="font-label-lg text-label-lg text-secondary uppercase tracking-wider">Privacy &amp; Security</h3>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
            <SettingsRow icon="share" title="Data Sharing" subtitle="Help improve app experience" last>
              <SettingsToggle id="toggle-data" />
            </SettingsRow>
            <div className="w-full flex items-center justify-between p-margin-mobile border-t border-outline-variant opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-stack-md">
                <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                <div>
                  <div className="font-headline-sm text-headline-sm">Two-Factor Authentication</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Preferences */}
        <section className="mb-stack-md md:mb-0">
          <div className="px-1 py-stack-sm">
            <h3 className="font-label-lg text-label-lg text-secondary uppercase tracking-wider">App Preferences</h3>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
            <SettingsRow icon="dark_mode" title="Dark Mode" subtitle="System default">
              <SettingsToggle id="toggle-dark" />
            </SettingsRow>
            <div className="w-full flex items-center justify-between p-margin-mobile border-t border-outline-variant opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-stack-md">
                <span className="material-symbols-outlined text-on-surface-variant">payments</span>
                <div className="font-headline-sm text-headline-sm">Currency</div>
              </div>
              <span className="font-body-md text-body-md text-on-surface-variant font-medium">KES</span>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-stack-lg md:mb-0">
          <div className="px-1 py-stack-sm">
            <h3 className="font-label-lg text-label-lg text-secondary uppercase tracking-wider">Support</h3>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
            <Link href="/help" className="w-full flex items-center justify-between p-margin-mobile border-b border-outline-variant hover:bg-surface-bright transition-colors active:bg-surface-container-high">
              <div className="flex items-center gap-stack-md">
                <span className="material-symbols-outlined text-on-surface-variant">help</span>
                <div className="font-headline-sm text-headline-sm">Help Center</div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </Link>
            <Link href="/help" className="w-full flex items-center justify-between p-margin-mobile border-b border-outline-variant hover:bg-surface-bright transition-colors active:bg-surface-container-high">
              <div className="flex items-center gap-stack-md">
                <span className="material-symbols-outlined text-on-surface-variant">support_agent</span>
                <div className="font-headline-sm text-headline-sm">Contact Us</div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </Link>
            <Link href="/about" className="w-full flex items-center justify-between p-margin-mobile hover:bg-surface-bright transition-colors active:bg-surface-container-high">
              <div className="flex items-center gap-stack-md">
                <span className="material-symbols-outlined text-on-surface-variant">info</span>
                <div className="font-headline-sm text-headline-sm">About Voltech</div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </Link>
          </div>
        </section>
      </div>

      <form action={handleSignOut} className="px-1 py-stack-lg flex justify-center">
        <button
          type="submit"
          className="w-full md:w-auto bg-surface-container-lowest border border-error text-error font-label-lg text-label-lg uppercase tracking-wider py-3 px-6 rounded hover:bg-error-container transition-colors"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  last,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between p-margin-mobile hover:bg-surface-bright transition-colors ${!last ? "border-b border-outline-variant" : ""}`}>
      <div className="flex items-center gap-stack-md">
        <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
        <div>
          <div className="font-headline-sm text-headline-sm">{title}</div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
