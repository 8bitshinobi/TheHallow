import { createObjectHandlers } from "@/lib/api/objectRoute";

// Public businesses. Same access model as /api/places (lib/api/objectRoute.ts).
// `front_for` (the GM-only hidden activity behind a business) is accepted on
// POST so it can be saved, but is deliberately NOT in textFields, so GET
// never returns it.
const handlers = createObjectHandlers({
  type: "business",
  responseKey: "businesses",
  source: "Business generator",
  filters: ["location", "category"],
  textFields: ["category", "description", "proprietor", "proprietor_quirk", "icon", "location"],
  listFields: [["goods"], ["patrons"], ["rumors"]],
  writeFields: [
    "category",
    "description",
    "proprietor",
    "proprietor_quirk",
    "goods",
    "patrons",
    "rumors",
    "location",
    "front_for",
  ],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
