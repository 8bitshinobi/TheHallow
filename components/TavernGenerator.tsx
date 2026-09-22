"use client";

import Link from "next/link";
import { useState } from "react";
import {
  fillEstablishedTavernBlanks,
  generateTavern,
  isCrowd,
  rerollField,
  rolledTavernFieldsToProperties,
  toLines,
  type CrowdChoice,
  type FillableTavernField,
  type GenContext,
  type Region,
  type RerollField,
  type TavernCard,
} from "@/lib/taverns/generate";
import { getEstablishedTaverns, saveRolledTavernFields } from "@/app/taverns/actions";
import { AREAS, isArea, type AreaChoice } from "@/lib/generatorShared";
import { iconFor } from "@/lib/icons";
import { Field, List } from "@/components/generatorParts";
import { CROWDS } from "@/lib/taverns/tables";

const CROWD_OPTIONS: CrowdChoice[] = ["Any", ...CROWDS];

/** Chance of showing a real public tavern (when one matches) instead of a new one. */
const ESTABLISHED_CHANCE = 0.3;

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; id: string }
  | { status: "error"; message: string };

type ApiTavern = {
  id: string;
  name: string;
  description: string;
  innkeeper: string;
  innkeeper_quirk: string;
  signature: string;
  signature_kind: string;
  icon: string;
  area: string;
  patron_crowd: string;
  employees: string[];
  drinks: string[];
  food: string[];
  patrons: string[];
  rumors: string[];
  location: string;
};

function fromApi(tavern: ApiTavern, regions: Region[]): TavernCard {
  return {
    established: true,
    id: tavern.id,
    icon: tavern.icon || undefined,
    name: tavern.name,
    description: tavern.description,
    innkeeper: tavern.innkeeper,
    innkeeperQuirk: tavern.innkeeper_quirk,
    signature: tavern.signature || undefined,
    signatureKind:
      tavern.signature_kind === "drink" || tavern.signature_kind === "food"
        ? tavern.signature_kind
        : undefined,
    area: isArea(tavern.area) ? tavern.area : undefined,
    crowd: isCrowd(tavern.patron_crowd) ? tavern.patron_crowd : undefined,
    employees: tavern.employees,
    drinks: tavern.drinks,
    food: tavern.food,
    patrons: tavern.patrons,
    rumors: tavern.rumors.map((text) => ({ text })),
    location: tavern.location,
    locationId: regions.find((region) => region.name === tavern.location)?.id,
  };
}

const selectClass =
  "rounded border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";
const buttonClass =
  "rounded border border-black/15 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/15";

export function TavernGenerator({ regions, hooks }: { regions: Region[]; hooks: string[] }) {
  const [regionId, setRegionId] = useState("");
  const [crowd, setCrowd] = useState<CrowdChoice>("Any");
  const [area, setArea] = useState<AreaChoice>("Any");
  const [card, setCard] = useState<TavernCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [rolledSave, setRolledSave] = useState<SaveState>({ status: "idle" });

  const context: GenContext = {
    region: regions.find((region) => region.id === regionId) ?? null,
    crowd,
    area,
    hooks,
  };

  async function generate() {
    setBusy(true);
    setSave({ status: "idle" });
    setRolledSave({ status: "idle" });
    try {
      if (Math.random() < ESTABLISHED_CHANCE) {
        const taverns = (await getEstablishedTaverns({
          location: context.region?.name,
          area: area !== "Any" ? area : undefined,
        })) as unknown as ApiTavern[];
        if (taverns.length > 0) {
          const chosen = taverns[Math.floor(Math.random() * taverns.length)];
          // Any fields left blank on the real record get randomly filled in
          // for display (tagged "rolled" below) rather than shown empty.
          setCard(fillEstablishedTavernBlanks(fromApi(chosen, regions), context));
          return;
        }
      }
      setCard(generateTavern(context));
    } finally {
      setBusy(false);
    }
  }

  /** True for a field that's tagged "rolled" — random, not yet real archive content. */
  function isRolled(field: FillableTavernField): boolean {
    return card?.rolledFields?.includes(field) ?? false;
  }

  // RerollField (the manual "reroll" button names) doesn't map 1:1 onto
  // FillableTavernField ("menu" covers both drinks and food; "rumor" is
  // "rumors" there), so this maps each button to whichever underlying
  // field(s) it corresponds to, for deciding whether an established card's
  // (already-real) value is locked or (still-rolled) is fair game.
  function canRerollOnEstablished(field: RerollField): boolean {
    switch (field) {
      case "innkeeper":
        return isRolled("innkeeper");
      case "menu":
        return isRolled("drinks") || isRolled("food");
      case "patrons":
        return isRolled("patrons");
      case "rumor":
        return isRolled("rumors");
      case "signature":
        return isRolled("signature");
      case "employees":
        return isRolled("employees");
      case "name":
        return false;
    }
  }

  function reroll(field: RerollField) {
    if (!card) return;
    // On an established card, only a field that's already "rolled" (not
    // real) can be rerolled — everything actually in the archive is locked.
    if (card.established && !canRerollOnEstablished(field)) return;
    setCard(rerollField(card, field, context));
    setSave({ status: "idle" });
  }

  async function saveRolledFields() {
    if (!card?.id || !card.rolledFields?.length) return;
    setRolledSave({ status: "saving" });
    const result = await saveRolledTavernFields(card.id, rolledTavernFieldsToProperties(card));
    if ("error" in result) {
      setRolledSave({ status: "error", message: result.error });
      return;
    }
    setRolledSave({ status: "saved", id: card.id });
    // Now genuinely real, so the tags/rerolls for those fields go away.
    setCard((prev) => (prev ? { ...prev, rolledFields: [] } : prev));
  }

  async function saveTavern() {
    if (!card || card.established) return;
    setSave({ status: "saving" });
    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: card.name,
          description: card.description,
          innkeeper: card.innkeeper,
          innkeeper_quirk: card.innkeeperQuirk,
          signature: card.signature,
          signature_kind: card.signatureKind,
          area: card.area,
          employees: toLines(card.employees),
          drinks: toLines(card.drinks),
          food: toLines(card.food),
          patrons: toLines(card.patrons),
          rumors: toLines(card.rumors.map((rumor) => rumor.text)),
          location: card.location,
          patron_crowd: card.crowd,
          location_id: card.locationId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setSave({ status: "error", message: result.error ?? "Save failed" });
        return;
      }
      setSave({ status: "saved", id: result.id });
    } catch {
      setSave({ status: "error", message: "Network error" });
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
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-black/60 dark:text-white/60">
          <span className="block">Patron crowd</span>
          <select
            value={crowd}
            onChange={(event) => setCrowd(event.target.value as CrowdChoice)}
            className={selectClass}
          >
            {CROWD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-black/60 dark:text-white/60">
          <span className="block">Area</span>
          <select
            value={area}
            onChange={(event) => setArea(event.target.value as AreaChoice)}
            className={selectClass}
          >
            {["Any", ...AREAS].map((option) => (
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

      {hooks.length === 0 && (
        <p className="text-xs text-black/50 dark:text-white/50">
          No lore is marked <code>visibility: public</code> yet, so lore rumors use placeholder
          hooks.
        </p>
      )}

      {card && (
        <article className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                <span aria-hidden>{iconFor("tavern", card.icon ? { icon: card.icon } : null)}</span>{" "}
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

          {(card.location || card.area) && (
            <p className="text-xs text-black/50 dark:text-white/50">
              {[card.location, card.area].filter(Boolean).join(" · ")}
              {isRolled("area") && (
                <span className="ml-2 rounded-full border border-dashed border-black/30 px-1.5 py-0.5 text-[10px] text-black/60 dark:border-white/30 dark:text-white/60">
                  rolled
                </span>
              )}
            </p>
          )}
          <p className="text-sm">{card.description}</p>

          <Field
            label="Innkeeper"
            tag={isRolled("innkeeper") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("innkeeper") ? () => reroll("innkeeper") : undefined}
          >
            {card.innkeeper}
            {card.innkeeperQuirk && <span className="block text-black/60 dark:text-white/60">{card.innkeeperQuirk}</span>}
          </Field>
          {(card.employees.length > 0 || !card.established) && (
            <Field
              label={`Staff (${card.employees.length})`}
              tag={isRolled("employees") ? "rolled" : undefined}
              onReroll={!card.established || isRolled("employees") ? () => reroll("employees") : undefined}
            >
              {card.employees.length > 0 ? (
                <List items={card.employees} />
              ) : (
                <span className="text-black/60 dark:text-white/60">Just the innkeeper.</span>
              )}
            </Field>
          )}
          {card.signature ? (
            <Field
              label={`House specialty${card.signatureKind ? ` (${card.signatureKind})` : ""}`}
              tag={isRolled("signature") ? "rolled" : undefined}
              onReroll={!card.established || isRolled("signature") ? () => reroll("signature") : undefined}
            >
              {card.signature}
            </Field>
          ) : (
            !card.established && (
              <button type="button" onClick={() => reroll("signature")} className="text-xs underline">
                + add a house specialty
              </button>
            )
          )}
          <Field
            label="Drinks"
            tag={isRolled("drinks") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("drinks") || isRolled("food") ? () => reroll("menu") : undefined}
          >
            <List items={card.drinks} />
          </Field>
          <Field label="Food" tag={isRolled("food") ? "rolled" : undefined}>
            <List items={card.food} />
          </Field>
          <Field
            label={`Patrons (${card.patrons.length})`}
            tag={isRolled("patrons") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("patrons") ? () => reroll("patrons") : undefined}
          >
            <List items={card.patrons} />
          </Field>
          <Field
            label="Rumors"
            tag={isRolled("rumors") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("rumors") ? () => reroll("rumor") : undefined}
          >
            <ul className="list-disc space-y-1 pl-5">
              {card.rumors.map((rumor) => (
                <li key={rumor.text}>
                  {rumor.text}
                  {rumor.kind && (
                    <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                      {rumor.kind === "gossip"
                        ? "gossip"
                        : rumor.kind === "lore"
                          ? "lore"
                          : "lore, placeholder hook"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Field>

          {!card.established && (
            <footer className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={saveTavern}
                disabled={save.status === "saving" || save.status === "saved"}
                className={buttonClass}
              >
                {save.status === "saving" ? "Saving…" : "Save this tavern"}
              </button>
              {save.status === "saved" && (
                <span className="text-sm">
                  Saved to the archive (in-app only for now).{" "}
                  <Link href={`/objects/${save.id}`} className="underline">
                    Open it
                  </Link>{" "}
                  if you want to review it or mark it <code>visibility: public</code> for the anonymous API.
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
                {rolledSave.status === "saving" ? "Saving…" : "Save rolled fields to this tavern"}
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
