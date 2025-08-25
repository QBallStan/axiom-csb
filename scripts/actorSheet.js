export function registerActorSheet() {
  Hooks.on("renderActorSheet", (app, html, data) => {
    const actor = app.actor;

    // === Trackers ===
    const healthTrack = html[0].querySelector('[data-name="healthTrack"]');
    const staminaTrack = html[0].querySelector('[data-name="stamTrack"]');
    const bleedoutTrack = html[0].querySelector('[data-name="bleedoutTrack"]');
    const penaltyLabel = html[0].querySelector(".dmgPenalty");

    const fortitude =
      (parseInt(actor.system?.props?.forBase) || 0) +
      (parseInt(actor.system?.props?.forAug) || 0);
    const resolve =
      (parseInt(actor.system?.props?.resBase) || 0) +
      (parseInt(actor.system?.props?.resAug) || 0);

    const lethalMax = 7 + Math.ceil(fortitude / 2);
    const stunMax = 7 + Math.ceil(resolve / 2);
    const bleedoutMax = 3 + Math.ceil(fortitude / 2);
    const bleedoutCurrent = actor.system?.bleedout ?? bleedoutMax;

    const lethalDamage = actor.system?.lethalDamage || 0;
    const stunDamage = actor.system?.stunDamage || 0;

    const lethalInput = html[0].querySelector(
      `#Actor\\.${actor.id}-lethalDamage`
    );
    const stunInput = html[0].querySelector(`#Actor\\.${actor.id}-stunDamage`);

    if (lethalInput) lethalInput.value = lethalDamage;
    if (stunInput) stunInput.value = stunDamage;

    const healthCurrent = lethalMax - lethalDamage;
    const staminaCurrent = stunMax - stunDamage;

    const healthTrackInput = html[0].querySelector(
      `#Actor\\.${actor.id}-healthTrack`
    );
    const stamTrackInput = html[0].querySelector(
      `#Actor\\.${actor.id}-stamTrack`
    );

    if (healthTrackInput)
      healthTrackInput.value = `${healthCurrent} / ${lethalMax}`;
    if (stamTrackInput) stamTrackInput.value = `${staminaCurrent} / ${stunMax}`;

    updateCombinedPenalty(lethalDamage, stunDamage, penaltyLabel);

    renderBoxTrack(
      healthTrack,
      lethalMax,
      lethalDamage,
      "health",
      actor,
      lethalInput
    );
    renderBoxTrack(
      staminaTrack,
      stunMax,
      stunDamage,
      "stamina",
      actor,
      stunInput
    );
    renderBleedoutTrack(bleedoutTrack, bleedoutMax, bleedoutCurrent, actor);

    const movementTrack = html[0].querySelector('[data-name="movTrack"]');
    const agility =
      (parseInt(actor.system?.props?.agiBase) || 0) +
      (parseInt(actor.system?.props?.agiAug) || 0);
    const movementMax = 5 + Math.ceil(agility / 2);
    const movementCurrent = actor.system?.movement ?? movementMax;

    renderMovementTrack(movementTrack, movementMax, movementCurrent, actor);

    const movStatLabel = html[0].querySelector('[data-name="movStat"]');
    if (movStatLabel) {
      movStatLabel.innerText = movementMax;
    }

    // === Damage Input Listeners
    lethalInput?.addEventListener("change", () => {
      const dmg = parseInt(lethalInput.value) || 0;
      const health = {
        value: lethalMax - dmg,
        max: lethalMax,
      };
      actor.update({
        "system.lethalDamage": dmg,
        "system.props.health": health,
        "system.props.healthTrack": health,
      });
      updateCombinedPenalty(dmg, actor.system?.stunDamage || 0, penaltyLabel);
      renderBoxTrack(healthTrack, lethalMax, dmg, "health", actor, lethalInput);
    });

    stunInput?.addEventListener("change", () => {
      const dmg = parseInt(stunInput.value) || 0;
      const stamina = {
        value: stunMax - dmg,
        max: stunMax,
      };
      actor.update({
        "system.stunDamage": dmg,
        "system.props.stamina": stamina,
        "system.props.stamTrack": stamina,
      });
      updateCombinedPenalty(actor.system?.lethalDamage || 0, dmg, penaltyLabel);
      renderBoxTrack(staminaTrack, stunMax, dmg, "stamina", actor, stunInput);
    });

    // === Attribute Auto-Calculation
    const stats = ["str", "agi", "for", "log", "res", "cha", "ins"];
    for (const stat of stats) {
      const baseInput = html[0].querySelector(
        `#Actor\\.${actor.id}-${stat}Base`
      );
      const augInput = html[0].querySelector(`#Actor\\.${actor.id}-${stat}Aug`);

      const handleChange = () => {
        const base = parseInt(baseInput?.value || "0");
        const aug = parseInt(augInput?.value || "0");
        const total = base + aug;

        const updateData = {
          [`system.props.${stat}Base`]: base,
          [`system.props.${stat}Aug`]: aug,
          [`system.props.${stat}Total`]: total,
        };

        actor.update(updateData);
      };

      baseInput?.addEventListener("change", handleChange);
      augInput?.addEventListener("change", handleChange);
    }

    // Corruption
    const corruptTresh = 4 + resolve;

    // Update visible corruption threshold field
    const corruptTreshField = html[0].querySelector(
      `#Actor\\.${actor.id}-corruptTresh`
    );
    if (corruptTreshField) {
      corruptTreshField.value = corruptTresh;
      corruptTreshField.disabled = true; // Makes the input uneditable
    }

    // Optionally update actor system if needed elsewhere
    actor.update({
      "system.props.corruptTresh": corruptTresh,
    });

    // === Focus UI CUSTOMIZATION ===
    const focusField = html.find(".actorFocus");
    if (focusField.length) {
      const visibleInput = focusField.find("input[type='text']");
      const hiddenInput = focusField.find(
        "input[name='system.props.actorFocus']"
      );

      if (!visibleInput.length || !hiddenInput.length) return;

      visibleInput.css({
        opacity: "0",
        width: "0px",
        height: "0px",
        pointerEvents: "none",
        position: "absolute",
      });

      if (!focusField.find(".boon-display").length) {
        const display = $(
          `<div class="boon-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`
        );
        focusField.append(display);
      }

      const renderFocus = () => {
        const value = parseInt(hiddenInput.val()) || 0;
        const display = focusField.find(".boon-display");
        display.empty();

        for (let i = 1; i <= 3; i++) {
          const die = $(
            `<i class="fa-solid fa-dice-d6" style="font-size: 18px; color: ${
              i <= value ? "#800" : "#333"
            }; cursor: pointer;"></i>`
          );

          die.on("mousedown", (event) => {
            event.preventDefault();
            let current = parseInt(hiddenInput.val()) || 0;
            if (event.button === 0) {
              current = Math.max(0, current - 1);
            } else if (event.button === 2) {
              current = Math.min(3, current + 1);
            }
            hiddenInput.val(current).trigger("change");
          });

          display.append(die);
        }

        // Prevent right-click menu
        display.on("contextmenu", (e) => e.preventDefault());
      };

      renderFocus();

      hiddenInput.on("input change", renderFocus);
      visibleInput.on("input change", () => {
        const newValue = parseInt(visibleInput.val() || "0") || 0;
        hiddenInput.val(newValue).trigger("change");
      });

      Hooks.once("updateActor", () => setTimeout(renderFocus, 50));
    }

    const apField = html.find(".actorAP");
    if (apField.length) {
      const visibleInput = apField.find("input[type='text']");
      const hiddenInput = apField.find("input[name='system.props.actorAP']");

      if (!visibleInput.length || !hiddenInput.length) return;

      visibleInput.css({
        opacity: "0",
        width: "0px",
        height: "0px",
        pointerEvents: "none",
        position: "absolute",
      });

      if (!apField.find(".ap-display").length) {
        const display = $(
          `<div class="ap-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`
        );
        apField.append(display);
      }

      const renderAP = () => {
        const value = parseInt(hiddenInput.val()) || 0;
        const display = apField.find(".ap-display");
        display.empty();

        for (let i = 1; i <= 3; i++) {
          const bolt = $(
            `<i class="fa-solid fa-bolt" style="font-size: 18px; color: ${
              i <= value ? "#800" : "#333"
            }; cursor: pointer;"></i>`
          );

          bolt.on("mousedown", (event) => {
            event.preventDefault();
            let current = parseInt(hiddenInput.val()) || 0;
            if (event.button === 0) {
              current = Math.max(0, current - 1);
            } else if (event.button === 2) {
              current = Math.min(3, current + 1);
            }
            hiddenInput.val(current).trigger("change");
          });

          display.append(bolt);
        }

        display.on("contextmenu", (e) => e.preventDefault());
      };

      renderAP();

      hiddenInput.on("input change", renderAP);
      visibleInput.on("input change", () => {
        const newValue = parseInt(visibleInput.val() || "0") || 0;
        hiddenInput.val(newValue).trigger("change");
      });

      Hooks.once("updateActor", () => setTimeout(renderAP, 50));
    }

    // Skill Container
    const skillsBlock = html[0].querySelector(
      ".custom-system-component-contents.actorSkills"
    );
    const skillsTable = skillsBlock?.querySelector("table");

    if (
      skillsBlock &&
      skillsTable &&
      !skillsBlock.querySelector(".skills-label")
    ) {
      const label = document.createElement("div");
      label.classList.add("panel-label");
      label.textContent = "Skills";
      skillsBlock.insertBefore(label, skillsTable);
    }

    // === Populate Skill Attribute Labels ===
    const skillAttFields = html[0].querySelectorAll(
      '[data-name^="actorSkills."][data-name$=".skillAtt"]'
    );

    for (const field of skillAttFields) {
      const dataName = field.getAttribute("data-name");
      const match = dataName.match(/^actorSkills\.(.+?)\.skillAtt$/);
      if (!match) continue;

      const itemId = match[1];
      const item = actor.items.get(itemId);
      if (!item) continue;

      const attKey = item.system?.props?.skillLinkedAtt || "";
      const label = attKey.toUpperCase(); // CSB uses STR, AGI, etc.

      field.textContent = label;
    }

    // Skill Level
    const skillLevelFields = html[0].querySelectorAll(
      '[data-name^="actorSkills."][data-name$=".skillLevel"]'
    );

    for (const field of skillLevelFields) {
      const dataName = field.getAttribute("data-name");
      const match = dataName.match(/^actorSkills\.(.+?)\.skillLevel$/);
      if (!match) continue;

      const itemId = match[1];
      const item = actor.items.get(itemId);
      if (!item) continue;

      const level = parseInt(item.system?.props?.skillLevel || 0);

      // Replace label div with input field
      field.innerHTML = ""; // clear out label content
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "8";
      input.value = level;
      input.style.width = "40px";
      input.style.textAlign = "center";

      input.addEventListener("change", () => {
        const newVal = Math.max(0, Math.min(8, parseInt(input.value) || 0));
        item.update({ "system.props.skillLevel": newVal });
      });

      field.appendChild(input);
    }

    // Skill Total
    const skillTotalFields = html[0].querySelectorAll(
      '[data-name^="actorSkills."][data-name$=".skillTotal"]'
    );

    for (const field of skillTotalFields) {
      const dataName = field.getAttribute("data-name");
      const match = dataName.match(/^actorSkills\.(.+?)\.skillTotal$/);
      if (!match) continue;

      const itemId = match[1];
      const item = actor.items.get(itemId);
      if (!item) continue;

      const attKey = (item.system?.props?.skillLinkedAtt || "").toLowerCase();
      const attTotal = parseInt(actor.system?.props?.[`${attKey}Total`] || 0);
      const skillLevel = parseInt(item.system?.props?.skillLevel || 0);

      const total = skillLevel + attTotal;
      field.textContent = total;
    }

    // === Attribute Tests Panel
    const attrPanel = html[0].querySelector(
      ".custom-system-component-contents.actorAttributeTests"
    );
    if (attrPanel && !attrPanel.querySelector(".panel-label")) {
      const label = document.createElement("div");
      label.classList.add("panel-label");
      label.textContent = "Attribute Tests";
      attrPanel.insertBefore(label, attrPanel.firstChild);
    }

    const attributeTests = [
      { name: "insightTotal", a: "logTotal", b: "insTotal" },
      { name: "perceptionTotal", a: "resTotal", b: "insTotal" },
      { name: "memoryTotal", a: "resTotal", b: "logTotal" },
      { name: "composureTotal", a: "chaTotal", b: "resTotal" },
      { name: "liftTotal", a: "strTotal", b: "forTotal" },
    ];

    for (const test of attributeTests) {
      const field = html[0].querySelector(`[data-name="${test.name}"]`);
      if (!field) continue;

      const valA = parseInt(actor.system?.props?.[test.a] || 0);
      const valB = parseInt(actor.system?.props?.[test.b] || 0);
      field.textContent = valA + valB;
    }

    // === Expertise Panel
    const expertisePanel = html[0].querySelector(
      ".custom-system-component-contents.actorExpertise"
    );
    if (expertisePanel && !expertisePanel.querySelector(".panel-label")) {
      const label = document.createElement("div");
      label.classList.add("panel-label");
      label.textContent = "Expertise";
      expertisePanel.insertBefore(label, expertisePanel.firstChild);
    }

    // === Expertise Totals
    const expertTotalFields = html[0].querySelectorAll(
      '[data-name^="actorExpertise."][data-name$=".expertTotal"]'
    );

    for (const field of expertTotalFields) {
      const dataName = field.getAttribute("data-name");
      const match = dataName.match(/^actorExpertise\.(\d+)\.expertTotal$/);
      if (!match) continue;

      const index = match[1];
      const attSelect = html[0].querySelector(
        `select[name="system.props.actorExpertise.${index}.expertAtt"]`
      );
      const levelInput = html[0].querySelector(
        `input[id$="actorExpertise.${index}.expertLevel"]`
      );
      const labelField = field;

      if (!attSelect || !levelInput || !labelField) continue;

      const update = () => {
        const attKey = attSelect.value?.trim()?.toLowerCase();
        const level = parseInt(levelInput.value || "0");
        const attTotal = parseInt(actor.system?.props?.[`${attKey}Total`] || 0);

        if (!attKey || isNaN(level)) {
          labelField.textContent = "–";
        } else {
          labelField.textContent = level + attTotal;
        }
      };

      update();
      attSelect.addEventListener("change", update);
      levelInput.addEventListener("input", update);
    }

    // === Language Panel
    const languagePanel = html[0].querySelector(
      ".custom-system-component-contents.actorLanguages"
    );
    if (languagePanel && !languagePanel.querySelector(".panel-label")) {
      const label = document.createElement("div");
      label.classList.add("panel-label");
      label.textContent = "Languages";
      languagePanel.insertBefore(label, languagePanel.firstChild);
    }
    // === Language Totals
    const langTotalFields = html[0].querySelectorAll(
      '[data-name^="actorLanguages."][data-name$=".langTotal"]'
    );

    for (const field of langTotalFields) {
      const dataName = field.getAttribute("data-name");
      const match = dataName.match(/^actorLanguages\.(\d+)\.langTotal$/);
      if (!match) continue;

      const index = match[1];
      const levelInput = html[0].querySelector(
        `input[name="system.props.actorLanguages.${index}.langLevel"]`
      );
      const labelField = field;

      if (!levelInput || !labelField) continue;

      const logicTotal = parseInt(actor.system?.props?.logTotal || 0);
      const levelRaw = levelInput.value?.trim();

      const update = () => {
        const raw = levelInput.value?.trim();
        if (raw === "N" || raw === "n") {
          labelField.textContent = "N";
        } else {
          const val = parseInt(raw);
          labelField.textContent = isNaN(val) ? "–" : val + logicTotal;
        }
      };

      update();
      levelInput.addEventListener("input", update);
    }
  });

  function renderBoxTrack(container, max, damage, type, actor, inputField) {
    if (!container || !actor) return;
    container.innerHTML = "";

    for (let i = 0; i < max; i++) {
      const indexFromRight = max - i - 1;
      const box = document.createElement("div");
      box.classList.add("box", type);

      if (indexFromRight < damage) box.classList.add("depleted");
      if ((indexFromRight + 1) % 3 === 0) {
        const penalty = Math.floor((indexFromRight + 1) / 3);
        box.classList.add("penalty-label");
        box.innerText = `–${penalty}`;
      }

      const key = type === "health" ? "lethalDamage" : "stunDamage";

      box.addEventListener("click", (e) => {
        e.preventDefault();
        const current = actor.system?.[key] || 0;
        const newValue = Math.min(current + 1, max);
        const value = max - newValue;
        const update = {
          [`system.${key}`]: newValue,
        };

        if (type === "health") {
          update["system.props.health"] = { value, max };
          update["system.props.healthTrack"] = { value, max };
        } else {
          update["system.props.stamina"] = { value, max };
          update["system.props.stamTrack"] = { value, max };
        }

        actor.update(update);
      });

      box.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const current = actor.system?.[key] || 0;
        const newValue = Math.max(current - 1, 0);
        const value = max - newValue;
        const update = {
          [`system.${key}`]: newValue,
        };

        if (type === "health") {
          update["system.props.health"] = { value, max };
          update["system.props.healthTrack"] = { value, max };
        } else {
          update["system.props.stamina"] = { value, max };
          update["system.props.stamTrack"] = { value, max };
        }

        actor.update(update);
      });

      container.appendChild(box);
    }
  }

  function renderBleedoutTrack(container, max, current, actor) {
    if (!container || !actor) return;
    container.innerHTML = "";

    for (let i = 0; i < max; i++) {
      const box = document.createElement("div");
      box.classList.add("box", "bleedout");

      if (i < current) {
        box.classList.add("filled");
      } else {
        box.classList.add("depleted");
      }

      box.addEventListener("click", (e) => {
        e.preventDefault();
        const newValue = Math.max(current - 1, 0);
        actor.update({
          "system.bleedout": newValue,
          "system.props.bleedout": { value: newValue, max },
        });
      });

      box.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const newValue = Math.min(current + 1, max);
        actor.update({
          "system.bleedout": newValue,
          "system.props.bleedout": { value: newValue, max },
        });
      });

      container.appendChild(box);
    }
  }

  function updateCombinedPenalty(lethal, stun, label) {
    if (!label) return;
    const penalty = Math.floor(lethal / 3) + Math.floor(stun / 3);
    label.innerText = `Penalty: –${penalty}`;
  }

  function renderMovementTrack(container, max, current, actor) {
    if (!container || !actor) return;
    container.innerHTML = "";

    for (let i = 0; i < max; i++) {
      const box = document.createElement("div");
      box.classList.add("box", "movement");

      if (i < current) {
        box.classList.add("filled");
      } else {
        box.classList.add("depleted");
      }

      box.addEventListener("click", (e) => {
        e.preventDefault();
        const newValue = Math.max(current - 1, 0);
        actor.update({
          "system.movement": newValue,
          "system.props.movTrack": { value: newValue, max },
        });
      });

      box.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const newValue = Math.min(current + 1, max);
        actor.update({
          "system.movement": newValue,
          "system.props.movTrack": { value: newValue, max },
        });
      });

      container.appendChild(box);
    }
  }
}
