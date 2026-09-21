"use client";

import Link from "next/link";
import { useState } from "react";
import {
  generateTavern,
  rerollField,
  toLines,
  type CrowdChoice,
  type GenContext,
  type Region,
  type RerollField,
  type TavernCard,
} from "@/lib/taverns/generate";
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
    name: tavern.name,
    description: tavern.description,
    innkeeper: tavern.innkeeper,
    innkeeperQuirk: tavern.innkeeper_quirk,
    signature: tavern.signature || undefined,
    signatureKind:
      tavern.signature_kind === "drink" || tavern.signature_kind === "food"
        ? tavern.signature_kind
        : undefined,
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
  const [card, setCard] = useState<TavernCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<SaveState>({ status: "idle" });

  const context: GenContext = {
    region: regions.find((region) => region.id === regionId) ?? null,
    crowd,
    hooks,
  };

  async function generate() {
    setBusy(true);
    setSave({ status: "idle" });
    try {
      if (Math.random() < ESTABLISHED_CHANCE) {
        const params = context.region ? `?location=${encodeURIComponent(context.region.name)}` : "";
        const response = await fetch(`/api/places${params}`);
        if (response.ok) {
          const { taverns } = (await response.json()) as { taverns: ApiTavern[] };
          if (taverns.length > 0) {
            const chosen = taverns[Math.floor(Math.random() * taverns.length)];
            setCard(fromApi(chosen, regions));
            return;
          }
        }
      }
      setCard(generateTavern(context));
    } finally {
      setBusy(false);
    }
  }

  function reroll(field: RerollField) {
    if (!card || card.established) return;
    setCard(rerollField(card, field, context));
    setSave({ status: "idle" });
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
              <h2 className="text-lg font-semibold">{card.name}</h2>
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
          <p className="text-sm">{card.description}</p>

          <Field label="Innkeeper" onReroll={card.established ? undefined : () => reroll("innkeeper")}>
            {card.innkeeper}
            {card.innkeeperQuirk && <span className="block text-black/60 dark:text-white/60">{card.innkeeperQuirk}</span>}
          </Field>
          {card.signature ? (
            <Field
              label={`House specialty${card.signatureKind ? ` (${card.signatureKind})` : ""}`}
              onReroll={card.established ? undefined : () => reroll("signature")}
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
          <Field label="Drinks" onReroll={card.established ? undefined : () => reroll("menu")}>
            <List items={card.drinks} />
          </Field>
          <Field label="Food">
            <List items={card.food} />
          </Field>
          <Field
            label={`Patrons (${card.patrons.length})`}
            onReroll={card.established ? undefined : () => reroll("patrons")}
          >
            <List items={card.patrons} />
          </Field>
          <Field label="Rumors" onReroll={card.established ? undefined : () => reroll("rumor")}>
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
                  Saved as private draft.{" "}
                  <Link href={`/objects/${save.id}`} className="underline">
                    Open it
                  </Link>{" "}
                  to review and set <code>visibility: public</code> when ready.
                </span>
              )}
              {save.status === "error" && (
                <span className="text-sm text-red-600 dark:text-red-400">{save.message}</span>
              )}
            </footer>
          )}
        </article>
      )}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-0.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Field({
  label,
  onReroll,
  children,
}: {
  label: string;
  onReroll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div>
        <div className="text-xs text-black/50 dark:text-white/50">{label}</div>
        {children}
      </div>
      {onReroll && (
        <button type="button" onClick={onReroll} className="shrink-0 text-xs underline">
          reroll
        </button>
      )}
    </div>
  );
}
