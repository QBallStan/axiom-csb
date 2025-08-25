// axiom-csb.js
import { registerActorSheet } from "./scripts/actorSheet.js";

Hooks.once("init", () => {
  // Any init-time config can go here later
});

Hooks.once("ready", () => {
  registerActorSheet();
});
