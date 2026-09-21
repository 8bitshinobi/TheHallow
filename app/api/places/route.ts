import { createObjectHandlers } from "@/lib/api/objectRoute";

// Public taverns. Shared access model and field handling: lib/api/objectRoute.ts.
// Only the fields below are returned by GET, so any other property on a
// tavern object (e.g. GM notes added later) never leaves the database here.
const handlers = createObjectHandlers({
  type: "tavern",
  responseKey: "taverns",
  source: "Tavern generator",
  filters: ["location"],
  textFields: [
    "description",
    "innkeeper",
    "innkeeper_quirk",
    "signature",
    "signature_kind",
    "icon",
    "location",
  ],
  // Second name is the older single-value property, so taverns saved before
  // lists existed still read correctly.
  listFields: [
    ["drinks", "drink"],
    ["food", "food"],
    ["patrons", "patrons"],
    ["rumors", "rumor"],
  ],
  writeFields: [
    "description",
    "innkeeper",
    "innkeeper_quirk",
    "signature",
    "signature_kind",
    "drinks",
    "food",
    "patrons",
    "rumors",
    "location",
    "patron_crowd",
  ],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
