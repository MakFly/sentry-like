import { SettingsContent } from "./settings-content";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SettingsContent />
    </div>
  );
}
