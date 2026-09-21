import { BusinessGenerator } from "@/components/BusinessGenerator";
import { loadGeneratorData } from "@/lib/generatorData";

export default async function BusinessesPage() {
  const { regions, hooks } = await loadGeneratorData();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Business Generator</h1>
      <BusinessGenerator regions={regions} hooks={hooks} />
    </div>
  );
}
