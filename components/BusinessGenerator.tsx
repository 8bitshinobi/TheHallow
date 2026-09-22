"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, List } from "@/components/generatorParts";
import {
  canHaveFront,
  fillEstablishedBusinessBlanks,
  generateBusiness,
  rerollBusinessField,
  rolledBusinessFieldsToProperties,
  type BusinessCard,
  type BusinessContext,
  type BusinessRerollField,
  type FillableBusinessField,
} from "@/lib/businesses/generate";
import { CATEGORY_NAMES } from "@/lib/businesses/tables";
import { getEstablishedBusinesses, saveRolledBusinessFields } from "@/app/businesses/actions";
import { AREAS, isArea, type AreaChoice } from "@/lib/generatorShared";
import { iconFor } from "@/lib/icons";
import { toLines, type Region } from "@/lib/taverns/generate";

/** Chance of showing a real public business (when one matches) instead of a new one. */
const ESTABLISHED_CHANCE = 0.3;

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; id: string }
  | { status: "error"; message: string };

type ApiBusiness = {
  id: string;
  name: string;
  category: string;
  description: string;
  proprietor: string;
  proprietor_quirk: string;
  icon: string;
  area: string;
  front_for: string;
  employees: string[];
  goods: string[];
  patrons: string[];
  rumors: string[];
  location: string;
};

function fromApi(business: ApiBusiness, regions: Region[]): BusinessCard {
  return {
    established: true,
    id: business.id,
    icon: business.icon || undefined,
    name: business.name,
    category: business.category,
    description: business.description,
    proprietor: business.proprietor,
    proprietorQuirk: business.proprietor_quirk,
    area: isArea(business.area) ? business.area : undefined,
    front: business.front_for || undefined,
    employees: business.employees,
    goods: business.goods,
    patrons: business.patrons,
    rumors: business.rumors.map((text) => ({ text })),
    location: business.location,
    locationId: regions.find((region) => region.name === business.location)?.id,
  };
}

const selectClass =
  "rounded border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15";
const buttonClass =
  "rounded border border-black/15 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/15";

export function BusinessGenerator({ regions, hooks }: { regions: Region[]; hooks: string[] }) {
  const [regionId, setRegionId] = useState("");
  const [category, setCategory] = useState("Any");
  const [area, setArea] = useState<AreaChoice>("Any");
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [rolledSave, setRolledSave] = useState<SaveState>({ status: "idle" });

  const context: BusinessContext = {
    region: regions.find((region) => region.id === regionId) ?? null,
    category,
    area,
    hooks,
  };

  async function generate() {
    setBusy(true);
    setSave({ status: "idle" });
    setRolledSave({ status: "idle" });
    try {
      if (Math.random() < ESTABLISHED_CHANCE) {
        const businesses = (await getEstablishedBusinesses({
          location: context.region?.name,
          category: category !== "Any" ? category : undefined,
          area: area !== "Any" ? area : undefined,
        })) as unknown as ApiBusiness[];
        if (businesses.length > 0) {
          const chosen = businesses[Math.floor(Math.random() * businesses.length)];
          // Any fields left blank on the real record get randomly filled in
          // for display (tagged "rolled" below) rather than shown empty.
          setCard(fillEstablishedBusinessBlanks(fromApi(chosen, regions), context));
          return;
        }
      }
      setCard(generateBusiness(context));
    } finally {
      setBusy(false);
    }
  }

  /** True for a field that's tagged "rolled" — random, not yet real archive content. */
  function isRolled(field: FillableBusinessField): boolean {
    return card?.rolledFields?.includes(field) ?? false;
  }

  // BusinessRerollField (the manual "reroll" button names) doesn't map 1:1
  // onto FillableBusinessField ("rumor" is "rumors" there), so this maps
  // each button to whichever underlying field it corresponds to, for
  // deciding whether an established card's (already-real) value is locked
  // or (still-rolled) is fair game.
  function canRerollOnEstablished(field: BusinessRerollField): boolean {
    switch (field) {
      case "proprietor":
        return isRolled("proprietor");
      case "goods":
        return isRolled("goods");
      case "patrons":
        return isRolled("patrons");
      case "rumor":
        return isRolled("rumors");
      case "front":
        return isRolled("front");
      case "employees":
        return isRolled("employees");
      case "name":
        return false;
    }
  }

  function reroll(field: BusinessRerollField) {
    if (!card) return;
    // On an established card, only a field that's already "rolled" (not
    // real) can be rerolled — everything actually in the archive is locked.
    if (card.established && !canRerollOnEstablished(field)) return;
    setCard(rerollBusinessField(card, field, context));
    setSave({ status: "idle" });
  }

  async function saveRolledFields() {
    if (!card?.id || !card.rolledFields?.length) return;
    setRolledSave({ status: "saving" });
    const result = await saveRolledBusinessFields(card.id, rolledBusinessFieldsToProperties(card));
    if ("error" in result) {
      setRolledSave({ status: "error", message: result.error });
      return;
    }
    setRolledSave({ status: "saved", id: card.id });
    // Now genuinely real, so the tags/rerolls for those fields go away.
    setCard((prev) => (prev ? { ...prev, rolledFields: [] } : prev));
  }

  async function saveBusiness() {
    if (!card || card.established) return;
    setSave({ status: "saving" });
    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: card.name,
          category: card.category,
          description: card.description,
          proprietor: card.proprietor,
          proprietor_quirk: card.proprietorQuirk,
          area: card.area,
          employees: toLines(card.employees),
          goods: toLines(card.goods),
          patrons: toLines(card.patrons),
          rumors: toLines(card.rumors.map((rumor) => rumor.text)),
          front_for: card.front,
          location: card.location,
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
          <span className="block">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={selectClass}
          >
            {["Any", ...CATEGORY_NAMES].map((option) => (
              <option key={option} value={option}>
                {option === "Any" ? option : `${iconFor("business", { category: option })} ${option}`}
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
                <span aria-hidden>
                  {iconFor("business", { category: card.category, ...(card.icon ? { icon: card.icon } : {}) })}
                </span>{" "}
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

          <p className="text-xs text-black/50 dark:text-white/50">
            {[card.category, card.location, card.area].filter(Boolean).join(" · ")}
            {isRolled("area") && (
              <span className="ml-2 rounded-full border border-dashed border-black/30 px-1.5 py-0.5 text-[10px] text-black/60 dark:border-white/30 dark:text-white/60">
                rolled
              </span>
            )}
          </p>
          <p className="text-sm">{card.description}</p>

          <Field
            label="Proprietor"
            tag={isRolled("proprietor") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("proprietor") ? () => reroll("proprietor") : undefined}
          >
            {card.proprietor}
            {card.proprietorQuirk && (
              <span className="block text-black/60 dark:text-white/60">{card.proprietorQuirk}</span>
            )}
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
                <span className="text-black/60 dark:text-white/60">Just the proprietor.</span>
              )}
            </Field>
          )}
          <Field
            label="Goods & services"
            tag={isRolled("goods") ? "rolled" : undefined}
            onReroll={!card.established || isRolled("goods") ? () => reroll("goods") : undefined}
          >
            <List items={card.goods} />
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

          {card.front ? (
            <div className="rounded border border-dashed border-black/30 p-3 dark:border-white/30">
              <Field
                label="GM only — hidden front"
                tag={isRolled("front") ? "rolled" : undefined}
                onReroll={!card.established || isRolled("front") ? () => reroll("front") : undefined}
              >
                {card.front}
              </Field>
            </div>
          ) : (
            !card.established &&
            canHaveFront(card.category) && (
              <button type="button" onClick={() => reroll("front")} className="text-xs underline">
                + add a hidden front (GM only)
              </button>
            )
          )}

          {!card.established && (
            <footer className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={saveBusiness}
                disabled={save.status === "saving" || save.status === "saved"}
                className={buttonClass}
              >
                {save.status === "saving" ? "Saving…" : "Save this business"}
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
                {rolledSave.status === "saving" ? "Saving…" : "Save rolled fields to this business"}
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
