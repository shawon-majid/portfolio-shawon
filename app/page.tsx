import Terminal from "@/components/Terminal";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  return (
    <Terminal
      initial={{
        askEnabled: settings.askEnabled,
        model: settings.model,
        headlines: settings.headlines,
        status: settings.status,
      }}
    />
  );
}
