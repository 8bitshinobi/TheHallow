import { NpcGenerator } from "@/components/NpcGenerator";
import { loadGeneratorData } from "@/lib/generatorData";
import { getNpcCandidates } from "@/app/npcs/actions";

export default async function NpcsPage() {
  const [{ regions }, npcCandidates] = await Promise.all([loadGeneratorData(), getNpcCandidates()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">NPC Generator</h1>
      <NpcGenerator regions={regions} npcCandidates={npcCandidates} />
    </div>
  );
}
