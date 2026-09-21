import { TavernGenerator } from "@/components/TavernGenerator";
import { loadGeneratorData } from "@/lib/generatorData";

export default async function TavernsPage() {
  const { regions, hooks } = await loadGeneratorData();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Tavern &amp; Inn Generator</h1>
      <TavernGenerator regions={regions} hooks={hooks} />
    </div>
  );
}
