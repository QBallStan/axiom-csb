export class AttributeConfigWindow extends FormApplication {
  constructor(actor) {
    super(actor);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "attribute-config-window",
      title: "Manage Attributes",
      template: "modules/axiom-csb/templates/attribute-config.hbs",
      width: 400,
      height: "auto",
      resizable: false,
    });
  }

  async getData() {
    const attrMap = {
      Strength: "Str",
      Agility: "Agi",
      Fortitude: "For",
      Intelligence: "Int",
      Charisma: "Cha",
      Resilience: "Res",
    };

    // Load existing config from flags or set defaults
    const config = (await this.actor.getFlag("axiom-csb", "attributeConfig")) || {};

    const data = {};
    for (const [longName, shortKey] of Object.entries(attrMap)) {
      data[longName] = {
        baseDie: config[`${shortKey}BaseDie`] ?? "3",
        mod: config[`${shortKey}DieMod`] ?? "0",
      };
    }

    return {
      attributes: data,
      dieOptions: [
        { key: "1", label: "d4-2" },
        { key: "2", label: "d4-1" },
        { key: "3", label: "d4" }, // ← default
        { key: "4", label: "d6" },
        { key: "5", label: "d8" },
        { key: "6", label: "d10" },
        { key: "7", label: "d12" },
        { key: "8", label: "d12+1" },
        { key: "9", label: "d12+2" },
      ],
    };
  }

  async _updateObject(event, formData) {
    const attrMap = {
      Strength: "Str",
      Agility: "Agi",
      Fortitude: "For",
      Intelligence: "Int",
      Charisma: "Cha",
      Resilience: "Res",
    };

    const configUpdate = {};
    for (const [k, v] of Object.entries(formData)) {
      const match = k.match(/(\w+)(BaseDie|DieMod)/);
      if (!match) continue;

      const [_, fullKey, suffix] = match;
      const shortKey = attrMap[fullKey];
      if (!shortKey) continue;

      configUpdate[`${shortKey}${suffix}`] = v;
    }

    await this.actor.setFlag("axiom-csb", "attributeConfig", {
      ...(await this.actor.getFlag("axiom-csb", "attributeConfig")),
      ...configUpdate,
    });

    await this.actor.render();
  }
}
