// === IMPORTS ===
import { getDieForStat, getDieLabel } from "../axiom-csb.js";
import { AttributeConfigWindow } from "./app/attConfig.js";
import { HealthConfigWindow } from "./app/healthConfig.js";
import { AxiomRollDialog } from "./rollDialog.js";

// === CONSTANTS ===
const EQUIP_OPTIONS_BY_TYPE = {
  weapon: ["stored", "backpack", "carried", "offHand", "mainHand", "twoHands"],
  armor: ["stored", "backpack", "carried", "equipped"],
  default: ["stored", "backpack", "carried"],
};

const EQUIP_LOCATIONS = {
  stored: { icon: "fa-box", label: "Stored" },
  backpack: { icon: "fa-backpack", label: "Backpack" },
  carried: { icon: "fa-suitcase", label: "Carried" },
  offHand: { icon: "fa-hand fa-flip-horizontal", label: "Off Hand" },
  mainHand: { icon: "fa-hand", label: "Main Hand" },
  twoHands: { icon: "fa-hands", label: "Two Hands" },
  equipped: { icon: "fa-shirt", label: "Equipped" },
};

const STRENGTH_BONUS_TABLE = {
  "d4-2": -2,
  "d4-1": -1,
  d4: 0,
  d6: 1,
  d8: 2,
  d10: 3,
  d12: 4,
  "d12+1": 5,
  "d12+2": 6,
  "d12+3": 7,
};

// === HELPERS ===
function renderEquipButton(button, locationKey) {
  const data = EQUIP_LOCATIONS[locationKey] ?? EQUIP_LOCATIONS.stored;
  button
    .empty()
    .append(
      `<i class="fa-solid ${data.icon}" aria-label="${data.label}" title="${data.label}"></i>`
    );
}

function getDieIconHtml(label, alt = "", extraClass = "") {
  const safeLabel = label.replace("+", "p").replace("-", "m");
  const dieMap = {
    "d4-2": "d4-2",
    "d4-1": "d4-1",
    d4: "d4",
    d6: "d6",
    d8: "d8",
    d10: "d10",
    d12: "d12",
    "d12+1": "d12+1",
    "d12+2": "d12+2",
    "d12+3": "d12+3",
  };

  const filename = dieMap[label] ?? label;
  return `<img src="modules/axiom-csb/assets/dice/${filename}.svg" alt="${
    alt || label
  }" class="die-icon ${extraClass}" />`;
}

// === HOOKS ===
// Re-render actor when skillBaseDie changes
// Hooks.on("updateItem", (item, changes, options, userId) => {
//  const actor = item.parent;
//  if (!actor || !actor.sheet?.rendered) return;
//
//  if (
//    "system" in changes &&
//    "props" in changes.system &&
//    "skillBaseDie" in changes.system.props
//  ) {
//    actor.render();
//  }
// });

// === REGISTER ACTOR SHEET ===
export function registerActorSheet() {
  Hooks.on("renderActorSheet", async (app, html) => {
    // === 1. GLOBAL SETUP ===
    // Delegate click on any plus/minus button within number fields
    html.find(".custom-system-number-field-control").on("click", (event) => {
      const input = $(event.currentTarget).siblings(
        "input[type='number'], input[type='range'], input[type='text']"
      );
      input.trigger("change");
    });

    const actor = app.actor;
    const statKeys = ["Str", "Agi", "For", "Int", "Cha", "Res"];
    const config = (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};

    // Only run this logic if the actor is newly created or explicitly missing values
    const hasAnyMissing = statKeys.some((key) => {
      const val = foundry.utils.getProperty(actor, `system.props.${key}Value`);
      return val == null;
    });

    if (hasAnyMissing) {
      const defaults = {};
      for (const key of statKeys) {
        const path = `system.props.${key}Value`;
        if (foundry.utils.getProperty(actor, path) == null) {
          defaults[path] = 3;
        }
      }
      if (Object.keys(defaults).length > 0) await actor.update(defaults);
    }

    // === 2. ATTRIBUTE UI: Pips, Labels, Buttons ===
    // - Pentagon rendering
    for (const key of statKeys) {
      let value = await actor.getFlag("axiom-csb", `${key}Value`);
      if (value === undefined || value === null) value = 3;
      value = parseInt(value);
      const base = parseInt(config[`${key}BaseDie`] ?? 3);
      const final = value;
      const label = getDieLabel(final);
      const shownPips = Math.max(1, value - base + 1);

      const container = html.find(
        `.custom-system-label-label[data-name="actor${key}Value"]`
      );
      if (container.length) {
        const pentagon =
          $(`<svg width="69" height="69" viewBox="0 0 100 100" class="pentagon-svg">
          <polygon points="50,5 95,35 77,90 23,90 5,35" fill="none" stroke="#666" stroke-width="2"/>
          ${[...Array(5)]
            .map((_, i) => {
              const [[x1, y1], [x2, y2]] = [
                [
                  [50, 5],
                  [95, 35],
                ],
                [
                  [95, 35],
                  [77, 90],
                ],
                [
                  [77, 90],
                  [23, 90],
                ],
                [
                  [23, 90],
                  [5, 35],
                ],
                [
                  [5, 35],
                  [50, 5],
                ],
              ][i];
              const stroke = i < shownPips ? "#880000" : "#333";
              return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="5"/>`;
            })
            .join("")}
          <foreignObject x="30" y="30" width="40" height="40">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
              ${getDieIconHtml(label, "", "die-icon-stat")}
            </div>
          </foreignObject>
        </svg>`);

        container
          .empty()
          .append($(`<div class="stat-block"></div>`).append(pentagon))
          .attr("data-value", label);
      }

      const labelContainer = html.find(
        `.custom-system-label-label[data-name="actor${key}Label"]`
      );
      if (labelContainer.length) {
        const minus = $(
          `<button class="stat-btn minus" data-stat="${key}">–</button>`
        );
        const plus = $(
          `<button class="stat-btn plus" data-stat="${key}">+</button>`
        );
        const rawText = labelContainer.text();
        const labelText = rawText ? rawText.trim() : ""; // ensure it's a string

        const wrapper = $(`<span class="label-with-buttons"></span>`)
          .append(minus)
          .append(`<span>${labelText}</span>`)
          .append(plus);

        labelContainer.empty().append(wrapper);
      }
    }

    // - +/- buttons for attributes
    html.find(".stat-btn").on("click", async function () {
      const stat = $(this).data("stat");
      let current = await actor.getFlag("axiom-csb", `${stat}Value`);
      if (current === undefined || current === null) current = 3;
      current = parseInt(current);

      const config =
        (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};
      const base = parseInt(config[`${stat}BaseDie`] ?? 3);
      const delta = $(this).hasClass("plus") ? 1 : -1;
      const min = base;
      const max = base + 4;
      const newVal = Math.max(min, Math.min(current + delta, max));

      await actor.setFlag("axiom-csb", `${stat}Value`, newVal);
      await actor.render(); // <- needed!
    });

    // === 3. HEALTH BAR RENDERING ===
    const container = html.find(".actorHealthBar");
    if (container.length) {
      if (container.find(".health-bar-wrapper").length === 0) {
        container.empty().append(`
      <div class="health-bar-wrapper" style="position: relative; display: flex; gap: 2px;">
        <div class="health-bar base" style="display: flex; gap: 2px; position: relative; z-index: 1;"></div>
        <div class="health-bar blue" style="display: flex; gap: 2px; position: absolute; top: 0; left: 0; z-index: 2; pointer-events: none;"></div>
        <div class="health-bar red" style="display: flex; gap: 2px; position: absolute; top: 0; left: 0; z-index: 3; pointer-events: none;"></div>
      </div>
    `);
      }

      const forVal = parseInt(
        (await actor.getFlag("axiom-csb", `ForValue`)) ?? 3
      );
      const forBase = parseInt(config["ForBaseDie"] ?? 3);
      const forMod = parseInt(config["ForDieMod"] ?? 0);
      const forStep = forVal + forMod;
      const forLabel = getDieLabel(forStep);

      let modifier = 0;
      const match = forLabel.match(/^d(\d+)([+-]\d+)?$/);
      if (match) {
        const base = parseInt(match[1]);
        const bonus = match[2] ? parseInt(match[2]) : 0;
        modifier = Math.floor(base / 2) + bonus;
      } else if (forLabel === "d4-1") {
        modifier = Math.floor(4 / 2) - 1;
      } else if (forLabel === "d4-2") {
        modifier = Math.floor(4 / 2) - 2;
      } else {
        modifier = 3;
      }

      const healthConfig =
        (await actor.getFlag("axiom-csb", "healthConfig")) ?? {};
      const bonusBoxes = parseInt(healthConfig.healthBonus ?? 0);

      const boxCount = 6 + modifier + bonusBoxes;

      const physicalDamage =
        parseInt(
          foundry.utils.getProperty(actor.system, "props.actorPhysicalDamage")
        ) || 0;
      const stunDamage =
        parseInt(
          foundry.utils.getProperty(actor.system, "props.actorStunDamage")
        ) || 0;

      const baseBar = container.find(".health-bar.base");
      const blueBar = container.find(".health-bar.blue");
      const redBar = container.find(".health-bar.red");

      baseBar.empty();
      blueBar.empty();
      redBar.empty();

      const threshold = parseInt(healthConfig.damageThreshold ?? 3);

      for (let i = 0; i < boxCount; i++) {
        const isGapBox =
          threshold > 0 && (boxCount - i - 1) % threshold === threshold - 1;
        const marginLeft = isGapBox && i !== 0 ? "4px" : "0px";

        const baseStyle = `width: 15px; height: 15px; background-color: #55555599; margin-left: ${marginLeft}; display: inline-block;`;
        const redStyle = `width: 15px; height: 15px; background-color: ${
          i >= boxCount - physicalDamage ? "#88000099" : "transparent"
        }; margin-left: ${marginLeft}; display: inline-block;`;
        const blueStyle = `width: 15px; height: 15px; background-color: ${
          i >= boxCount - stunDamage - physicalDamage &&
          i < boxCount - physicalDamage
            ? "#0088ff99"
            : "transparent"
        }; margin-left: ${marginLeft}; display: inline-block;`;

        baseBar.append(`<div class="hp-box" style="${baseStyle}"></div>`);
        redBar.append(`<div class="hp-box" style="${redStyle}"></div>`);
        blueBar.append(`<div class="hp-box" style="${blueStyle}"></div>`);
      }
    }

    // === 4. BOONS UI CUSTOMIZATION ===
    const boonsField = html.find(".actorBoons");
    if (boonsField.length) {
      const inputSpan = boonsField.find(".custom-system-number-input-span");
      const input = inputSpan
        .find("input[type='number'], input[name*='actorBoons']")
        .last();
      if (!input.length) return;

      input.css({
        opacity: "0",
        width: "0px",
        height: "0px",
        pointerEvents: "none",
        position: "absolute",
      });
      inputSpan
        .find("input[type='text'], input[type='number']")
        .css("display", "none");

      if (!input.siblings(".boon-display").length) {
        const display = $(
          `<div class="boon-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`
        );
        input.after(display);
      }

      const renderBoons = () => {
        const display = boonsField.find(".boon-display");
        display.empty();
        const value = parseInt(input.val()) || 0;
        for (let i = 1; i <= 3; i++) {
          const die = $(
            `<i class="fa-solid fa-dice-d6" style="font-size: 18px; color: ${
              i <= value ? "#800" : "#333"
            };"></i>`
          );
          display.append(die);
        }
      };

      renderBoons();
      input.on("input change", () => renderBoons());
      Hooks.once("updateActor", () => setTimeout(renderBoons, 50));
    }

    // === ACTION POINTS UI CUSTOMIZATION ===
    const apField = html.find(".actorActionPanel");
    if (apField.length) {
      const inputSpan = apField.find(".custom-system-number-input-span");
      const input = inputSpan
        .find("input[type='number'], input[name*='actorAP']")
        .last();
      if (!input.length) return;

      input.css({
        opacity: "0",
        width: "0px",
        height: "0px",
        pointerEvents: "none",
        position: "absolute",
      });
      inputSpan
        .find("input[type='text'], input[type='number']")
        .css("display", "none");

      if (!input.siblings(".ap-display").length) {
        const display = $(
          `<div class="ap-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`
        );
        input.after(display);
      }

      const renderAP = () => {
        const display = apField.find(".ap-display");
        display.empty();
        const value = parseInt(input.val()) || 0;
        for (let i = 1; i <= 3; i++) {
          const bolt = $(
            `<i class="fa-solid fa-bolt" style="font-size: 18px; color: ${
              i <= value ? "#800" : "#333"
            };"></i>`
          );
          display.append(bolt);
        }
      };

      renderAP();
      input.on("input change", () => renderAP());
      Hooks.once("updateActor", () => setTimeout(renderAP, 50));
    }

    // === 5. DERIVED STATS: Guard, Movement, CorruptionThreshold ===
    if (actor?.type === "character") {
      const updates = {};
      const props = actor.system?.props ?? {};

      // === Damage Penalty Calculation ===
      const stun = parseInt(props.actorStunDamage ?? 0);
      const physical = parseInt(props.actorPhysicalDamage ?? 0);

      const healthConfig =
        (await actor.getFlag("axiom-csb", "healthConfig")) ?? {};
      const threshold = parseInt(healthConfig.damageThreshold ?? 3);

      // Inject dynamic CSS for threshold-based gap styling in health bar
      $("#axiom-health-style").remove(); // Clean up if re-rendered

      const styleTag = $(`
        <style id="axiom-health-style">
          .health-bar .hp-box {
            width: 15px;
            height: 15px;
            display: inline-block;
            background-color: #222;
            margin-right: 1px;
          }

          .health-bar .hp-box:nth-last-child(${threshold}n):not(:last-child) {
            margin-left: 4px !important;
          }
        </style>
      `);
      $("head").append(styleTag);

      const totalDamage = stun + physical;
      const penalty = Math.floor(totalDamage / threshold) * -1;

      if ((props.actorDamagePenalty ?? 0) !== penalty) {
        updates["system.props.actorDamagePenalty"] = penalty;
      }

      // === Corruption Threshold (from Resolve)
      const attVal = parseInt(
        (await actor.getFlag("axiom-csb", "ResValue")) ?? 3
      );
      const attBase = parseInt(config["ResBaseDie"] ?? 3);
      const attMod = parseInt(config["ResDieMod"] ?? 0);
      const attStep = attVal + attMod;
      const resLabel = getDieLabel(attStep);
      const resMatch = resLabel.match(/^d(\d+)([+-]\d+)?$/);
      const resStep = resMatch ? parseInt(resMatch[1]) : 6;
      const resBonus = resMatch && resMatch[2] ? parseInt(resMatch[2]) : 0;
      const corruptionThreshold = 2 + Math.floor(resStep / 2) + resBonus;
      if ((props.actorCorruptionThreshold ?? 0) !== corruptionThreshold) {
        updates["system.props.actorCorruptionThreshold"] = corruptionThreshold;
      }

      // === Get skills from actorSkillsDisplay
      const skillDisplay = actor.system?.props?.actorSkillsDisplay ?? {};
      const getSkillItemByName = (name) => {
        const entry = Object.values(skillDisplay).find(
          (e) => (e.name || "").toLowerCase().trim() === name.toLowerCase()
        );
        return entry ? actor.items.get(entry.id) : null;
      };

      // === Guard (from Melee)
      let guard = 0;
      const meleeSkill = getSkillItemByName("melee");
      if (meleeSkill) {
        const skillVal = parseInt(
          (await actor.getFlag("axiom-csb", `skillValue.${meleeSkill.id}`)) ?? 1
        );
        const skillBase = parseInt(meleeSkill.system?.props?.skillBaseDie ?? 3);
        const skillMod = parseInt(meleeSkill.system?.props?.skillDieMod ?? 0);
        const skillStep = skillBase + (skillVal - 1) + skillMod;
        const meleeLabel = getDieLabel(skillStep);

        const meleeMatch = meleeLabel.match(/^d(\d+)([+-]\d+)?$/);
        const meleeStep = meleeMatch ? parseInt(meleeMatch[1]) : 6;
        const meleeBonus =
          meleeMatch && meleeMatch[2] ? parseInt(meleeMatch[2]) : 0;
        guard = 6 + Math.floor(meleeStep / 2) + meleeBonus;
        if ((props.actorGuard ?? 0) !== guard) {
          updates["system.props.actorGuard"] = guard;
        }
      }

      // === Movement (from Athletics)
      let movement = 0;
      const athleticsSkill = getSkillItemByName("athletics");
      if (athleticsSkill) {
        const skillVal = parseInt(
          (await actor.getFlag(
            "axiom-csb",
            `skillValue.${athleticsSkill.id}`
          )) ?? 1
        );
        const skillBase = parseInt(
          athleticsSkill.system?.props?.skillBaseDie ?? 3
        );
        const skillMod = parseInt(
          athleticsSkill.system?.props?.skillDieMod ?? 0
        );
        const skillStep = skillBase + (skillVal - 1) + skillMod;
        const athleticsLabel = getDieLabel(skillStep);
        const athleticsMatch = athleticsLabel.match(/^d(\d+)([+-]\d+)?$/);
        const athleticsStep = athleticsMatch ? parseInt(athleticsMatch[1]) : 6;
        const athleticsBonus =
          athleticsMatch && athleticsMatch[2] ? parseInt(athleticsMatch[2]) : 0;
        movement = 6 + Math.floor(athleticsStep / 2) + athleticsBonus;
        if ((props.actorMovement ?? 0) !== movement) {
          updates["system.props.actorMovement"] = movement;
        }
      }

      // === Apply updates to actor
      if (Object.keys(updates).length > 0) {
        await actor.update(updates);
      }

      // === Update displayed values on sheet ===
      const renderDerivedStat = (stat, value) => {
        html
          .find(`.custom-system-label-label[data-name="actor${stat}"]`)
          .empty()
          .text(value)
          .attr("data-value", value);
      };

      renderDerivedStat("Guard", guard);
      renderDerivedStat("Movement", movement);
      renderDerivedStat("CorruptionThreshold", corruptionThreshold);

      // === Bind corruption input logic ===
      const corruptionField = html.find(".actorCorruptionValue");
      const visibleInput = corruptionField.find(`input[type="text"]`);
      const hiddenInput = corruptionField.find(
        `input[name="system.props.actorCorruptionValue"]`
      );
      const currentCorruption = parseInt(hiddenInput.val() || "0") || 0;

      visibleInput.val(currentCorruption);

      visibleInput.on("change blur", () => {
        const newValue = parseInt(visibleInput.val() || "0");
        hiddenInput.val(newValue).trigger("change");
      });

      visibleInput.on("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopImmediatePropagation();
          visibleInput.blur(); // triggers change handler
        }
      });

      // === Armor (from equipped armor pieces) ===
      let totalArmor = 0;

      for (const item of actor.items) {
        const props = item.system?.props ?? {};
        const isEquipped = props.itemLocation === "equipped";
        const armorValue = parseInt(props.armorChest ?? 0);

        if (isEquipped && !isNaN(armorValue)) {
          totalArmor += armorValue;
        }
      }

      if ((props.actorArmor ?? 0) !== totalArmor) {
        updates["system.props.actorArmor"] = totalArmor;
      }

      renderDerivedStat("Armor", totalArmor);
      renderDerivedStat("DamagePenalty", penalty); // optional visual update
    }

    if (actor.system?.props?.actorArmor == null) {
      await actor.update({ "system.props.actorArmor": 0 });
    }
    if (actor.system?.props?.actorDamagePenalty == null) {
      await actor.update({ "system.props.actorDamagePenalty": 0 });
    }

    // === 6. SKILL UI: Pips, Recap, Attribute Display ===
    // - Value pips
    const skillValueElements = html
      .find(`.custom-system-label-label[data-name$=".actorSkillValue"]`)
      .toArray();

    for (const el of skillValueElements) {
      const container = $(el);
      const dataName = container.data("name");
      const itemId = dataName.split(".")[1];
      const item = actor.items.get(itemId);
      if (!item) continue;

      let skillValue = await actor.getFlag(
        "axiom-csb",
        `skillValue.${item.id}`
      );
      if (skillValue === undefined || skillValue === null) skillValue = 1;
      skillValue = parseInt(skillValue);

      const skillBase = parseInt(item.system?.props?.skillBaseDie ?? 3);
      const skillMod = parseInt(item.system?.props?.skillDieMod ?? 0);
      const clamped = Math.max(1, Math.min(skillValue, 5));
      const finalStep = skillBase + (skillValue - 1) + skillMod;
      const dieLabel = getDieLabel(finalStep);

      const renderPips = (val) => {
        return `
      <div class="skill-pip-block">
        <button type="button" class="skill-btn minus" data-id="${itemId}">–</button>
        <div class="pip-display">
          ${[...Array(5)]
            .map(
              (_, i) =>
                `<span class="skill-pip" style="color: ${
                  i < val ? "#880000" : "#333"
                }">⬤</span>`
            )
            .join("")}
        </div>
        <button type="button" class="skill-btn plus" data-id="${itemId}">+</button>
      </div>`;
      };

      container
        .empty()
        .append(renderPips(clamped))
        .attr("data-value", dieLabel);
    }

    // - Recap display with roll handler
    const recapElements = html
      .find(`.custom-system-label-label[data-name$=".actorSkillRecap"]`)
      .toArray();

    for (const el of recapElements) {
      const container = $(el);
      const dataName = container.data("name");
      const itemId = dataName.split(".")[1];
      const item = actor.items.get(itemId);
      if (!item) continue;

      const statKey = item.system?.props?.skillLinkedAtt ?? "Int";

      let skillValue = await actor.getFlag(
        "axiom-csb",
        `skillValue.${item.id}`
      );
      if (skillValue === undefined || skillValue === null) skillValue = 1;
      skillValue = parseInt(skillValue);

      const skillBase = parseInt(item.system?.props?.skillBaseDie ?? 3);
      const finalStep = skillBase + (skillValue - 1);
      const skillDie = getDieLabel(finalStep);
      const attValue = parseInt(
        (await actor.getFlag("axiom-csb", `${statKey}Value`)) ?? 3
      );
      const attBase = parseInt(config[`${statKey}BaseDie`] ?? 3);
      const attMod = parseInt(config[`${statKey}DieMod`] ?? 0);
      const finalAttStep = attBase + (attValue - 3) + attMod;
      const attributeDie = getDieLabel(finalAttStep);
      const attributeMod = attMod;
      const recap = `${skillDie}+${attributeDie}`;

      const isFavTable = container.closest(".actorSkillsFav").length > 0;
      const displayText = isFavTable ? "" : recap;

      container
        .html(`${getDieIconHtml(skillDie)} + ${getDieIconHtml(attributeDie)}`)
        .attr("data-value", recap)
        .css("cursor", "pointer")
        .on("click", async () => {
          const skillName = item.name;
          let skillValue = await actor.getFlag(
            "axiom-csb",
            `skillValue.${item.id}`
          );
          if (skillValue === undefined || skillValue === null) skillValue = 1;
          skillValue = parseInt(skillValue);

          const skillBase = parseInt(item.system?.props?.skillBaseDie ?? 3);
          const skillMod = parseInt(item.system?.props?.skillDieMod ?? 0);
          const finalSkillStep = skillBase + (skillValue - 1) + skillMod;
          const skillDie = getDieLabel(finalSkillStep);

          const config =
            (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};
          const attributeMod = parseInt(config[`${statKey}DieMod`] ?? 0);
          new AxiomRollDialog(actor, {
            skillName,
            skillDie,
            attributeKey: statKey,
            attributeDie,
            skillMod,
            attributeMod,
            penalty: 0,
            focusMod: 0,
          }).render(true);
        });
    }

    html.find(".skill-btn").on("click", async function () {
      const itemId = $(this).data("id");
      const item = actor.items.get(itemId);
      if (!item) return;

      let current = await actor.getFlag("axiom-csb", `skillValue.${itemId}`);
      if (current === undefined || current === null) current = 1;
      current = parseInt(current);

      const delta = $(this).hasClass("plus") ? 1 : -1;
      const newVal = Math.max(1, Math.min(current + delta, 5));

      await actor.setFlag("axiom-csb", `skillValue.${itemId}`, newVal);
      await actor.render();
    });

    // - Attribute column abbreviation
    html
      .find(`.custom-system-label-label[data-name$=".actorSkillAtt"]`)
      .each(function () {
        const container = $(this);
        const dataName = container.data("name");
        const itemId = dataName.split(".")[1];
        const item = actor.items.get(itemId);
        if (!item) return;
        const key = item.system?.props?.skillLinkedAtt ?? "Int";
        container.text(key).attr("data-value", key);
      });

    // === 7. CONFIG BUTTONS ===
    // - Attributes Config
    html
      .find(`.custom-system-label-label[data-name="actorAttConfig"]`)
      .each(function () {
        const container = $(this);
        const button = $(
          `<button class="att-config-button" title="Configure Attributes"><i class="fas fa-cog"></i></button>`
        );

        container.empty().append(button);

        button.on("click", (ev) => {
          if (ev.detail === 0) {
            return;
          }

          new AttributeConfigWindow(actor).render(true);
        });
      });

    // - Health Config
    html
      .find(`.custom-system-label-label[data-name="actorHealthConfig"]`)
      .each(function () {
        const container = $(this);
        const button = $(
          `<button class="health-config-button" title="Configure Health"><i class="fas fa-cog"></i></button>`
        );
        container.empty().append(button);

        button.on("click", (ev) => {
          if (ev.detail === 0) return;
          new HealthConfigWindow(actor).render(true);
        });
      });

    // === 8. ATTRIBUTE ROLL BUTTON (Dual Attribute Dice) ===
    html
      .find(`.custom-system-label-label[data-name="actorAttRoll"]`)
      .each(function () {
        const container = $(this);
        const iconHtml = `<i class="fa-solid fa-dice" style="margin-right: 4px;"></i>`;
        container.html(iconHtml);
        container.css("cursor", "pointer");

        container.on("click", async () => {
          const att1Key = html
            .find("select[name='system.props.actorAtt_1']")
            .val();
          const att2Key = html
            .find("select[name='system.props.actorAtt_2']")
            .val();
          const config =
            (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};

          const att1Val = parseInt(
            (await actor.getFlag("axiom-csb", `${att1Key}Value`)) ?? 3
          );
          const att2Val = parseInt(
            (await actor.getFlag("axiom-csb", `${att2Key}Value`)) ?? 3
          );
          const att1Base = parseInt(config[`${att1Key}BaseDie`] ?? 3);
          const att2Base = parseInt(config[`${att2Key}BaseDie`] ?? 3);
          const att1Mod = parseInt(config[`${att1Key}DieMod`] ?? 0);
          const att2Mod = parseInt(config[`${att2Key}DieMod`] ?? 0);

          const finalStep1 = att1Base + (att1Val - 3) + att1Mod;
          const finalStep2 = att2Base + (att2Val - 3) + att2Mod;

          const att1Die = getDieLabel(finalStep1);
          const att2Die = getDieLabel(finalStep2);

          const skillName = `${att1Key} + ${att2Key}`;

          new AxiomRollDialog(actor, {
            skillName,
            skillDie: att2Die,
            skillMod: att2Mod,
            attributeKey: att1Key,
            attributeDie: att1Die,
            attributeMod: att1Mod,
            penalty: 0,
            focusMod: 0,
            dualAttribute: true,
          }).render(true);
        });
      });

    html
      .find(`.custom-system-label-label[data-name="actorUnskilledRoll"]`)
      .each(function () {
        const container = $(this);
        container
          .html(`<i class="fa-solid fa-dice"></i>`)
          .css("cursor", "pointer");

        container.on("click", async () => {
          const attKey =
            foundry.utils.getProperty(actor, "system.props.actorAtt") ?? "Int";
          const config =
            (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};

          const attValue = parseInt(
            (await actor.getFlag("axiom-csb", `${attKey}Value`)) ?? 3
          );
          const attBase = parseInt(config[`${attKey}BaseDie`] ?? 3);
          const attMod = parseInt(config[`${attKey}DieMod`] ?? 0);
          const finalStep = attBase + (attValue - 3) + attMod;
          const attributeDie = getDieLabel(finalStep);

          new AxiomRollDialog(actor, {
            skillName: "Untrained",
            skillDie: "d4-2",
            skillMod: 0,
            attributeKey: attKey,
            attributeDie,
            attributeMod: attMod,
            penalty: 0,
            focusMod: 0,
          }).render(true);
        });
      });

    // === 9. WEAPON ROLL BUTTONS ===
    html
      .find(`.custom-system-label-label[data-name$=".weaponRoll"]`)
      .each(function () {
        const container = $(this);
        const dataName = container.data("name"); // e.g. "actorWeaponsDisplay.XYZ.weaponRoll"
        const itemId = dataName.split(".")[1];

        const item = app.actor.items.get(itemId);
        if (!item) return;

        const props = item.system?.props ?? {};

        // ✅ Show the button visually
        container
          .html(`<i class="fa-solid fa-dice" style="margin-right: 4px;"></i>`)
          .css("cursor", "pointer");

        container.on("click", async () => {
          const actor = app.actor;
          const weaponSkillName = (props.weaponSkill || "")
            .trim()
            .toLowerCase();
          if (!weaponSkillName) {
            return ui.notifications.warn("No skill set for this weapon.");
          }

          const skillEntry = Object.values(
            actor.system.props.actorSkillsDisplay ?? {}
          ).find(
            (s) => (s.name || "").trim().toLowerCase() === weaponSkillName
          );
          if (!skillEntry) {
            return ui.notifications.warn(
              `No matching skill found for: ${weaponSkillName}`
            );
          }

          const skillItem = actor.items.get(skillEntry.id);
          if (!skillItem) {
            return ui.notifications.warn("Skill item not found.");
          }

          const config =
            (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};
          const skillKey = skillItem.system?.props?.skillLinkedAtt ?? "Int";

          // === SKILL DIE
          const skillVal = parseInt(
            (await actor.getFlag("axiom-csb", `skillValue.${skillItem.id}`)) ??
              1
          );
          const skillBase = parseInt(
            skillItem.system?.props?.skillBaseDie ?? 3
          );
          const skillMod = parseInt(skillItem.system?.props?.skillDieMod ?? 0);
          const skillStep = skillBase + (skillVal - 1); // ✅ corrected: no skillMod added here
          const skillDie = getDieLabel(skillStep);

          // === ATTRIBUTE DIE
          const attVal = parseInt(
            (await actor.getFlag("axiom-csb", `${skillKey}Value`)) ?? 3
          );
          const attBase = parseInt(config[`${skillKey}BaseDie`] ?? 3);
          const attMod = parseInt(config[`${skillKey}DieMod`] ?? 0);
          const attStep = attBase + (attVal - 3); // ✅ same: no attMod added to die
          const attributeDie = getDieLabel(attStep);

          new AxiomRollDialog(actor, {
            skillName: skillItem.name,
            skillDie,
            attributeKey: skillKey,
            attributeDie,
            skillMod,
            attributeMod: attMod,
            penalty: 0,
            focusMod: 0,
          }).render(true);
        });
      });

    // === 10. ITEM CONTROL BUTTONS ===
    html.find(".item-edit").each(function () {
      this.style.cursor = "pointer";

      this.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const row = $(this).closest("tr");
        const link = row.find("a.content-link[data-id]").get(0);
        if (!link) {
          console.warn("[Axiom] Edit button clicked but item link not found");
          return;
        }

        const itemId = link.getAttribute("data-id");
        const actor = app.actor;
        const item = actor.items.get(itemId);

        if (item) {
          item.sheet.render(true);
        } else {
          console.warn(`[Axiom] No item found with ID: ${itemId}`);
        }
      });
    });

    html.find(".favorite-status").each(function () {
      this.style.cursor = "pointer";

      this.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const row = $(this).closest("tr");
        const link = row.find("a.content-link[data-id]").get(0);
        if (!link) return;

        const itemId = link.getAttribute("data-id");
        const actor = app.actor;
        const item = actor.items.get(itemId);
        if (!item) return;

        const current = !!item.system?.props?.favorite;
        const newValue = !current;

        await item.update({ "system.props.favorite": newValue });

        // Let CSB update the checkbox automatically
        const icon = this.querySelector("i");
        if (icon) {
          icon.style.color = newValue ? "#880000" : "#333";
        }
      });

      // Initial visual state on render
      const row = $(this).closest("tr");
      const link = row.find("a.content-link[data-id]").get(0);
      if (!link) return;

      const itemId = link.getAttribute("data-id");
      const actor = app.actor;
      const item = actor.items.get(itemId);
      if (!item) return;

      const icon = this.querySelector("i");
      if (icon) {
        const fav = !!item.system?.props?.favorite;
        icon.style.color = fav ? "#880000" : "#333";
      }
    });

    html.find(".equip-status").each(function () {
      const button = $(this);
      const row = button.closest("tr");
      const link = row.find("a.content-link[data-id]").get(0);
      if (!link) return;

      const itemId = link.getAttribute("data-id");
      const actor = app.actor;
      const item = actor.items.get(itemId);
      if (!item) return;

      const current = item.system?.props?.itemLocation ?? "stored";
      renderEquipButton(button, current);

      // === Menu behavior ===
      button.off("click").on("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        // Close any existing menu
        $(".equip-status-menu").remove();

        const menu = $('<ul class="equip-status-menu"></ul>').css({
          position: "absolute",
          top: button.offset().top + button.outerHeight(),
          left: button.offset().left,
          background: "#222",
          border: "1px solid #555",
          padding: "4px",
          margin: "0",
          "z-index": 10000,
          "border-radius": "4px",
          "box-shadow": "0 2px 6px rgba(0,0,0,0.5)",
          "list-style": "none",
        });

        const type = (item.system?.props?.itemType ?? "default").toLowerCase();
        const allowed =
          EQUIP_OPTIONS_BY_TYPE[type] ?? EQUIP_OPTIONS_BY_TYPE.default;

        for (const key of allowed) {
          const data = EQUIP_LOCATIONS[key];
          const entry = $(`<li style="padding: 4px 8px; cursor: pointer;">
    <i class="fa-solid ${data.icon}" style="margin-right: 6px;"></i> ${data.label}
  </li>`);

          entry.hover(
            function () {
              $(this).css("background-color", "#444");
            },
            function () {
              $(this).css("background-color", "transparent");
            }
          );

          entry.on("click", async () => {
            await item.update({ "system.props.itemLocation": key });
            renderEquipButton(button, key);
            menu.remove();
          });

          menu.append(entry);
        }

        $("body").append(menu);

        // Close if clicking elsewhere
        $(document).one("click", () => menu.remove());
      });
    });

    await Promise.all(
      html
        .find(".actorWeaponsDisplay .custom-system-dynamicRow")
        .map(async function () {
          const row = $(this);
          const itemId = row.find("[data-uuid]").data("id");
          const item = app.actor.items.get(itemId);
          if (!item) return;

          const props = item.system?.props ?? {};
          const strBonusEnabled = !!props.weaponStrBonus;
          const baseDamage = parseInt(props.weaponDamage ?? 0);
          const dmgClassKey = props.weaponDamageClass === "Stun" ? "S" : "P";

          let totalDamage = baseDamage;

          if (strBonusEnabled) {
            const strVal = parseInt(
              (await app.actor.getFlag("axiom-csb", "StrValue")) ?? 3
            );
            const config =
              (await app.actor.getFlag("axiom-csb", "attributeConfig")) ?? {};
            const strBase = parseInt(config["StrBaseDie"] ?? 3);
            const strMod = parseInt(config["StrDieMod"] ?? 0);
            const strStep = strBase + (strVal - 3) + strMod;
            const strDie = getDieLabel(strStep);
            const bonus = STRENGTH_BONUS_TABLE[strDie] ?? 0;
            totalDamage += bonus;
          }

          row
            .find(`[data-name$=".weaponDamage"]`)
            .text(`${totalDamage}${dmgClassKey}`);
        })
        .get() // converts jQuery object to array
    );

    // === 11. ITEM DESCRIPTION FIELD ===
    html.find('a.content-link[data-type="Item"]').each(function () {
      const link = $(this);

      link.off("click").on("click", async function (event) {
        event.preventDefault();
        event.stopPropagation();

        const itemId = link.data("id");
        const row = link.closest("tr");
        const colCount = row.children("td").length;

        const actor = app.actor;
        const item = actor.items.get(itemId);
        if (!item) return;

        const props = item.system?.props ?? {};
        const description = props.itemDescription ?? "";

        const nextRow = row.next();
        if (nextRow.hasClass("axiom-item-desc")) {
          const wrapper = nextRow.find(".axiom-item-desc-wrapper");
          wrapper.css("max-height", "0");

          setTimeout(() => {
            nextRow.remove();
          }, 300);
          return;
        }

        const descRow = $(`
      <tr class="axiom-item-desc">
        <td colspan="${colCount}">
          <div class="axiom-item-desc-wrapper" style="
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
          ">
            <div class="axiom-item-desc-content">
              ${description || "<em>No description available.</em>"}
            </div>
          </div>
        </td>
      </tr>
    `);

        row.after(descRow);
        setTimeout(() => {
          descRow.find(".axiom-item-desc-wrapper").css("max-height", "500px");
        }, 10);
      });
    });

    // === 12. QUANTITY HANDLERS ===
    // === Weapon Ammo Counter ===
    html
      .find('[data-name$=".weaponAmmo"]')
      .on("mousedown", async function (event) {
        event.preventDefault();

        const row = $(this).closest("tr");
        const itemId = row.find("[data-uuid]").data("id");
        const actor = app.actor;
        const item = actor.items.get(itemId);
        if (!item) return;

        const props = item.system?.props ?? {};
        let current = parseInt(props.weaponCurrentAmmo ?? 0);
        const max = parseInt(props.weaponAmmoCap ?? current);

        if (event.button === 0)
          current = Math.max(0, current - 1); // Left click = –1
        else if (event.button === 2)
          current = Math.min(max, current + 1); // Right click = +1
        else return;

        await item.update({ "system.props.weaponCurrentAmmo": current });
      });

    // === Gear Quantity Field ===
    html
      .find('[data-name$=".gearQty"]')
      .on("mousedown", async function (event) {
        event.preventDefault();

        const row = $(this).closest("tr");
        const itemId = row.find("[data-uuid]").data("id");
        const actor = app.actor;
        const item = actor.items.get(itemId);
        if (!item) return;

        const props = item.system?.props ?? {};
        let qty = parseInt(props.gearQty ?? 1);

        if (event.button === 0) qty = Math.max(0, qty - 1); // Left click = –1
        else if (event.button === 2)
          qty = Math.min(99, qty + 1); // Right click = +1
        else return;

        await item.update({ "system.props.gearQty": qty });
      });

    // === MOVE TABS TO RIGHT EDGE LIKE BOOKMARKS ===
    const tabNav = html.find("nav.sheet-tabs");
    if (tabNav.length) {
      // Style the tab container
      tabNav.addClass("axiom-bookmark-tabs");

      // Move it outside the inner sheet into the app frame
      const sheetRoot = html.closest(".window-app");
      sheetRoot.append(tabNav);

      // Replace tab text with icons
      tabNav
        .find("a.actorStatsTab")
        .html('<i class="fa-solid fa-list-tree"></i>');
      tabNav
        .find("a.actorCombatTab")
        .html('<i class="fa-solid fa-swords"></i>');
      tabNav
        .find("a.actorNotesTab")
        .html('<i class="fa-solid fa-note-sticky"></i>');
    }
  });
}
