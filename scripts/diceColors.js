// Register Dice So Nice color sets for Axiom//Core
// Register Dice So Nice color sets for Axiom//Core
Hooks.once("diceSoNiceReady", () => {
  game.dice3d.addColorset({
    name: "axiom-attribute",
    description: "Attribute Die (Blue)",
    category: "Axiom",
    foreground: "#ffffff",
    background: "#1976d2",
    edge: "#0d47a1",
    material: "plastic",
    font: "Modesto",
    contrast: 1.2
  });

  game.dice3d.addColorset({
    name: "axiom-skill",
    description: "Skill Die (Red)",
    category: "Axiom",
    foreground: "#ffffff",
    background: "#d32f2f",
    edge: "#b71c1c",
    material: "plastic",
    font: "Modesto",
    contrast: 1.2
  });

  game.dice3d.addColorset({
    name: "axiom-focus",
    description: "Focus Die (Amber)",
    category: "Axiom",
    foreground: "#000000",
    background: "#ffca28",
    edge: "#ffb300",
    material: "plastic",
    font: "Modesto",
    contrast: 1.3
  });
});

export function applyAxiomDieColors(roll) {
  const diceTerms = roll.terms.filter(t => t instanceof foundry.dice.terms.Die);

  if (diceTerms[0]) diceTerms[0].options.colorset = "axiom-attribute";
  if (diceTerms[1]) diceTerms[1].options.colorset = "axiom-skill";
  if (diceTerms[2]) diceTerms[2].options.colorset = "axiom-focus";

  return diceTerms;
}
