import { ObjectCreateForm } from "@/components/ObjectCreateForm";
import { listObjectTypes } from "@/lib/objects";

export default async function NewObjectPage() {
  const types = await listObjectTypes();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">New object</h1>
      <ObjectCreateForm existingTypes={types} />
    </div>
  );
}
