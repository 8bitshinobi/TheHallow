"use client";

import Link from "next/link";
import { useState } from "react";
import { Field } from "@/components/generatorParts";
import { getEstablishedNpcs, saveNpc, saveRolledNpcFields } from "@/app/npcs/actions";
import { iconFor } from "@/lib/icons";
import {
  fillEstablishedNpcBlanks,
  generateNpc,
  rerollNpcField,
  rolledNpcFieldsToProperties,
  type FillableNpcField,
  type NpcCandidate,
  type NpcCard,
  type NpcRerollField,
} from "@/lib/npcs/generate";
import { OCCUPATION_TYPES, type OccupationType } from "@/lib/npcs/tables";
import type { Region } from "@/lib/taverns/generate";

type OccupationChoice = OccupationType | "Any";

/** Chance of showing a real existing NPC (when one matches) instead of a new one. */
const ESTABLISHED_CHANCE = 0.3;

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; id: string }
  | { status: "error"; message: string };

type ApiNpc = {
  id: string;
  name: string;
  icon: string;
  ancestry: string;
  occupation: string;
  occupation_type: string;
  description: string;
  personality: string;
  ideals: string;
  flaws: string;
  bonds: string;
  motivation: string;
  location: string;
};

function isOccupationType(value: string): value is OccupationType {
  return (OCCUPATION_TYPES as readonly string[]).includes(value);
}

function fromApi(npc: ApiNpc, regions: Region[]): NpcCard {
  return {
    established: true,
    id: npc.id,
    icon: npc.icon || undefined,
    name: npc.name,
    ancestry: npc.ancestry,
    occupation: npc.occupation,
    occupationType: isOccupationType(npc.occupation_type) ? npc.occupation_type : undefined,
    description: npc.description,
    personality: npc.personality,
    ideals: npc.ideals,
    flaws: npc.flaws,
    bonds: npc.bonds,
    motivation: npc.motivation,
    location: npc.location,
    locationId: regions.find((region) => region.name === npc.location)?.id,
  };
}

const selectClass =
  "rounded border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";
const buttonClass =
  "rounded border border-black/15 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/15";

export function NpcGenerator({
  regions,
  npcCandidates,
}: {
  regions: Region[];
  npcCandidates: NpcCandidate[];
}) {
  const [regionId, setRegionId] = useState("");
  const [occupationType, setOccupationType] = useState<OccupationChoice>("Any");
  const [card, setCard] = useState<NpcCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [rolledSave, setRolledSave] = useState<SaveState>({ status: "idle" });

  const region = regions.find((r) => r.id === regionId) ?? null;
  const context = {
    occupationType,
    location: region ? { id: region.id, name: region.name } : null,
    npcCandidates,
  };

  async function generate() {
    setBusy(true);
    setSave({ status: "idle" });
    setRolledSave({ status: "idle" });
    try {
      if (Math.random() < ESTABLISHED_CHANCE) {
        const npcs = (await getEstablishedNpcs({
          location: region?.name,
          occupation_type: occupationType !== "Any" ? occupationType : undefined,
        })) as unknown as ApiNpc[];
        if (npcs.length > 0) {
          const chosen = npcs[Math.floor(Math.random() * npcs.length)];
          // Any fields left blank on the real record get randomly filled in
          // for display (tagged "rolled" below) rather than shown empty —
          // likely for the archive's hand-written NPCs, which predate these
          // fields entirely.
          setCard(fillEstablishedNpcBlanks(fromApi(chosen, regions), context));
          return;
        }
      }
      setCard(generateNpc(context));
    } finally {
      setBusy(false);
    }
  }

  /** True for a field that's tagged "rolled" — random, not yet real archive content. */
  function isRolled(field: FillableNpcField): boolean {
    return card?.rolledFields?.includes(field) ?? false;
  }

  function reroll(field: NpcRerollField) {
    if (!card) return;
    // On an established card, only a field that's already "rolled" (not
    // real) can be rerolled — everything actually in the archive is locked.
    // "name" is never fillable (a real object always has one), so it's
    // never rerollable once established.
    if (card.established && (field === "name" || !isRolled(field))) return;
    setCard(rerollNpcField(card, field, context));
    setSave({ status: "idle" });
  }

  async function saveRolledFields() {
    if (!card?.id || !card.rolledFields?.length) return;
    setRolledSave({ status: "saving" });
    const result = await saveRolledNpcFields(card.id, rolledNpcFieldsToProperties(card));
    if ("error" in result) {
      setRolledSave({ status: "error", message: result.error });
      return;
    }
    setRolledSave({ status: "saved", id: card.id });
    // Now genuinely real, so the tags/rerolls for those fields go away.
    setCard((prev) => (prev ? { ...prev, rolledFields: [] } : prev));
  }

  async function handleSave() {
    if (!card || card.established) return;
    setSave({ status: "saving" });
    try {
      const result = await saveNpc({
        name: card.name,
        ancestry: card.ancestry,
        occupation: card.occupation,
        occupationType: card.occupationType,
        description: card.description,
        personality: card.personality,
        ideals: card.ideals,
        flaws: card.flaws,
        bonds: card.bonds,
        motivation: card.motivation,
        location: card.location,
        locationId: card.locationId,
      });
      setSave({ status: "saved", id: result.id });
    } catch (err) {
      setSave({ status: "error", message: err instanceof Error ? err.message : "Save failed" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-xs text-black/60 dark:text-white/60">
          <span className="block">Location</span>
          <select
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-black/60 dark:text-white/60">
          <span className="block">Occupation type</span>
          <select
            value={occupationType}
            onChange={(event) => setOccupationType(event.target.value as OccupationChoice)}
            className={selectClass}
          >
            {["Any", ...OCCUPATION_TYPES].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>

      {card && (
        <article className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                <span aria-hidden>{iconFor("NPC", card.icon ? { icon: card.icon } : null)}</span>{" "}
                {card.name}
              </h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  card.established
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 dark:border-white/15"
                }`}
              >
                {card.established ? "established" : "new"}
              </span>
            </div>
            {!card.established && (
              <button type="button" onClick={() => reroll("name")} className="text-xs underline">
                reroll name
              </button>
            )}
          </header>

          {card.location && (
            <p className="text-xs text-black/50 dark:text-white/50">{card.location}</p>
          )}

          <Field
            label="Ancestry"
            tag={isRolled("ancestry") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("ancestry") ? () => reroll("ancestry") : undefined}
          >
            {card.ancestry}
          </Field>
          <Field
            label="Description"
            tag={isRolled("description") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("description") ? () => reroll("description") : undefined}
          >
            {card.description}
          </Field>
          <Field
            label="Personality"
            tag={isRolled("personality") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("personality") ? () => reroll("personality") : undefined}
          >
            {card.personality}
          </Field>
          <Field
            label="Ideals"
            tag={isRolled("ideals") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("ideals") ? () => reroll("ideals") : undefined}
          >
            {card.ideals}
          </Field>
          <Field
            label="Flaws"
            tag={isRolled("flaws") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("flaws") ? () => reroll("flaws") : undefined}
          >
            {card.flaws}
          </Field>
          <Field
            label="Bonds"
            tag={isRolled("bonds") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("bonds") ? () => reroll("bonds") : undefined}
          >
            {card.bonds}
          </Field>
          <Field
            label="Motivation"
            tag={isRolled("motivation") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("motivation") ? () => reroll("motivation") : undefined}
          >
            {card.motivation}
          </Field>
          <Field
            label="Occupation"
            tag={isRolled("occupation") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("occupation") ? () => reroll("occupation") : undefined}
          >
            {card.occupation}
          </Field>

          {!card.established && (
            <footer className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={handleSave}
                disabled={save.status === "saving" || save.status === "saved"}
                className={buttonClass}
              >
                {save.status === "saving" ? "Saving…" : "Save this NPC"}
              </button>
              {save.status === "saved" && (
                <span className="text-sm">
                  Saved to the archive.{" "}
                  <Link href={`/objects/${save.id}`} className="underline">
                    Open it
                  </Link>{" "}
                  if you want to review it or mark it <code>visibility: public</code>.
                </span>
              )}
              {save.status === "error" && (
                <span className="text-sm text-red-600 dark:text-red-400">{save.message}</span>
              )}
            </footer>
          )}

          {card.established && card.rolledFields && card.rolledFields.length > 0 && (
            <footer className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 dark:border-white/10">
              <span className="text-xs text-black/50 dark:text-white/50">
                Fields tagged &quot;rolled&quot; above were blank in the archive and randomly filled
                in just now.
              </span>
              <button
                type="button"
                onClick={saveRolledFields}
                disabled={rolledSave.status === "saving" || rolledSave.status === "saved"}
                className={buttonClass}
              >
                {rolledSave.status === "saving" ? "Saving…" : "Save rolled fields to this NPC"}
              </button>
              {rolledSave.status === "saved" && (
                <span className="text-sm text-green-700 dark:text-green-400">Saved.</span>
              )}
              {rolledSave.status === "error" && (
                <span className="text-sm text-red-600 dark:text-red-400">{rolledSave.message}</span>
              )}
            </footer>
          )}
        </article>
      )}
    </div>
  );
}
