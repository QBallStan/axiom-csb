export function registerActorSheet() {
    Hooks.on("renderActorSheet", (app, html) => {
        // Enables +/– buttons on number fields
        html.find(".custom-system-number-field-control").on("click", event => {
        const input = $(event.currentTarget).siblings("input[type='number'], input[type='range'], input[type='text']");
        input.trigger("change");
        });

        // Attribute Pips
        const fields = ["StrValue", "IntValue", "AgiValue", "ResValue", "ForValue", "ChaValue"];
        for (const key of fields) {
        const container = html.find(`.${key}`);
        if (!container.length) continue;

        const input = container.find(`input[type='range'], input[name='system.props.${key}']`).last();
        if (!input.length) {
            console.warn(`[Axiom//Pips] Input for ${key} not found.`);
            continue;
        }

        input.css({ opacity: "0", width: "0px", height: "0px", pointerEvents: "none", position: "absolute" });

        if (!input.siblings(".pip-display").length) {
            const pipDisplay = $(`<div class="pentagon-display"></div>`);
            input.after(pipDisplay);
        }

        const renderPips = () => {
            const pipDisplay = container.find(".pentagon-display");
            pipDisplay.empty();
            const value = parseInt(input.val()) || 1;
            const svg = $(`
            <svg width="69" height="69" viewBox="0 0 100 100" class="pentagon-svg">
                <polygon points="50,5 95,35 77,90 23,90 5,35" class="pentagon-outline"/>
                ${[...Array(5)].map((_, i) => {
                const sides = [
                    [[50, 5], [95, 35]],
                    [[95, 35], [77, 90]],
                    [[77, 90], [23, 90]],
                    [[23, 90], [5, 35]],
                    [[5, 35], [50, 5]]
                ];
                const [[x1, y1], [x2, y2]] = sides[i];
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i < value ? '#880000' : '#333'}" stroke-width="5"/>`;
                }).join("")}
            </svg>
            `);
            pipDisplay.append(svg);
        };

        renderPips();
        input.on("input change", () => renderPips());
        Hooks.once("updateActor", () => setTimeout(renderPips, 50));
        }

        // Skill Pips
        html.find("[class*='CharacterSkillLevel']").each((_, el) => {
        const container = $(el);
        const input = container.find("input[type='range'], input[name*='CharacterSkillLevel']").last();
        if (!input.length) return;

        input.css({ opacity: "0", width: "0px", height: "0px", pointerEvents: "none", position: "absolute" });
        if (!input.siblings(".pip-display").length) {
            const pipDisplay = $(`<div class="pip-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`);
            input.after(pipDisplay);
        }

        const renderPips = () => {
            const pipDisplay = container.find(".pip-display");
            pipDisplay.empty();
            const rawValue = parseInt(input.val()) || 3;
            const value = rawValue - 2;

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "20");
            svg.setAttribute("height", "20");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.classList.add("pentagon-skill-svg");

            const center = [50, 50];
            const radius = 45;
            const angles = [...Array(6)].map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);

            for (let i = 0; i < 5; i++) {
            const a1 = angles[i];
            const a2 = angles[(i + 1) % 5];
            const x1 = center[0] + Math.cos(a1) * radius;
            const y1 = center[1] + Math.sin(a1) * radius;
            const x2 = center[0] + Math.cos(a2) * radius;
            const y2 = center[1] + Math.sin(a2) * radius;

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M${center[0]},${center[1]} L${x1},${y1} L${x2},${y2} Z`);
            path.setAttribute("fill", i < value ? "#880000" : "#333");
            svg.appendChild(path);
            }

            pipDisplay.append(svg);
        };

        renderPips();
        input.on("input change", () => renderPips());
        Hooks.once("updateActor", () => setTimeout(renderPips, 50));
        });

        // Health Bar
        const actor = app.actor;
        const container = html.find(".axiomCharacterHealthBar");
        if (container.length) {
        const forDie = foundry.utils.getProperty(actor.system, "props.ForDieLabel") || "d6";
        const dieStep = parseInt(forDie.replace(/[^\d]/g, "")) || 6;
        const boxCount = 6 + Math.floor(dieStep / 2);

        const physicalDamage = parseInt(foundry.utils.getProperty(actor.system, "props.axiomCharacterPhysicalDamage")) || 0;
        const stunDamage = parseInt(foundry.utils.getProperty(actor.system, "props.axiomCharacterStunDamage")) || 0;
        const totalDamage = Math.min(physicalDamage + stunDamage, boxCount);

        const bar = container.find(".health-bar");
        bar.empty();
        for (let i = 0; i < boxCount; i++) {
            const indexFromRight = boxCount - 1 - i;
            const box = $(`<div class="hp-box"></div>`);
            if (indexFromRight < physicalDamage) box.css("background-color", "#800");
            else if (indexFromRight < totalDamage) box.css("background-color", "#08f");
            else box.css("background-color", "#eaeaea");
            bar.append(box);
        }
        }

        // Boons
        const boonsField = html.find(".axiomCharacterBoonsCount");
        if (boonsField.length) {
        const inputSpan = boonsField.find(".custom-system-number-input-span");
        const input = inputSpan.find("input[type='number'], input[name*='axiomCharacterBoonsCount']").last();
        if (!input.length) return;

        input.css({ opacity: "0", width: "0px", height: "0px", pointerEvents: "none", position: "absolute" });
        inputSpan.find("input[type='text'], input[type='number']").css("display", "none");

        if (!input.siblings(".boon-display").length) {
            const display = $(`<div class="boon-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`);
            input.after(display);
        }

        const renderBoons = () => {
            const display = boonsField.find(".boon-display");
            display.empty();
            const value = parseInt(input.val()) || 0;
            for (let i = 1; i <= 3; i++) {
            const die = $(`<i class="fa-solid fa-dice-d6" style="font-size: 18px; color: ${i <= value ? '#800' : '#333'};"></i>`);
            display.append(die);
            }
        };

        renderBoons();
        input.on("input change", () => renderBoons());
        Hooks.once("updateActor", () => setTimeout(renderBoons, 50));
        }

        // Derived Stats Calculation
        if (actor?.type === "character") {
        const system = actor.toObject().system;
        const updates = {};
        const props = system.props || {};

        const forDie = props.ForDieLabel || "d4";
        const forStep = parseInt(forDie.replace(/[^\d]/g, "")) || 6;
        const toughness = 2 + Math.floor(forStep / 2);
        if ((props.axiomCharacterToughness ?? 0) !== toughness) updates["system.props.axiomCharacterToughness"] = toughness;

        const resDie = props.ResDieLabel || "d4";
        const resStep = parseInt(resDie.replace(/[^\d]/g, "")) || 6;
        const corruptionThreshold = 2 + Math.floor(resStep / 2);
        if ((props.axiomCharacterCorruptionThreshold ?? 0) !== corruptionThreshold) updates["system.props.axiomCharacterCorruptionThreshold"] = corruptionThreshold;

        const skillEntries = Array.isArray(props.axiomCharacterSkillPanel) ? props.axiomCharacterSkillPanel : Object.values(props.axiomCharacterSkillPanel || {});

        let meleeStep = 2;
        for (const skill of skillEntries) {
            if ((skill?.CharacterSkillName || "").toLowerCase().trim() === "melee") {
            const die = skill.CharacterSkillDie || "d6";
            meleeStep = parseInt(die.replace(/[^\d]/g, "")) || 6;
            break;
            }
        }
        const guard = 6 + Math.floor(meleeStep / 2);
        if ((props.axiomCharacterGuard ?? 0) !== guard) updates["system.props.axiomCharacterGuard"] = guard;

        let athleticsStep = 2;
        for (const skill of skillEntries) {
            if ((skill?.CharacterSkillName || "").toLowerCase().trim() === "athletics") {
            const die = skill.CharacterSkillDie || "d6";
            athleticsStep = parseInt(die.replace(/[^\d]/g, "")) || 6;
            break;
            }
        }
        const movement = 6 + Math.floor(athleticsStep / 2);
        if ((props.axiomCharacterMovement ?? 0) !== movement) updates["system.props.axiomCharacterMovement"] = movement;

        if (Object.keys(updates).length > 0) actor.update(updates);
        }
        // Ammo Counter
        html.find(".ammo-counter").each((_, el) => {
        const $el = $(el);
        const classList = $el.attr("class") ?? "";

        const match = classList.match(/axiomCharacterWeapons\.([a-zA-Z0-9]+)\.itemCurrentAmmo/);
        if (!match) return;

        const itemId = match[1];
        const actor = app.actor;
        const item = actor.items.get(itemId);
        if (!item) return;

        $el.on("mousedown", async (event) => {
            event.preventDefault();

            const current = item.system.props.axiomWeaponCurrentAmmo ?? 0;
            const cap = item.system.props.axiomWeaponAmmoCap ?? 0;
            let newVal = current;

            if (event.button === 0) {
            newVal = Math.max(current - 1, 0);
            } else if (event.button === 2) {
            newVal = Math.min(current + 1, cap);
            } else {
            return;
            }

            await item.update({ "system.props.axiomWeaponCurrentAmmo": newVal });
        });

        $el.on("contextmenu", (e) => e.preventDefault());
        });
    });
}



