export class HealthConfigWindow extends FormApplication {
  constructor(actor) {
    super(actor);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "health-config-window",
      title: "Health Settings",
      template: "modules/axiom-csb/templates/health-config.hbs",
      width: 400,
      height: "auto",
      resizable: false,
    });
  }

  async getData() {
    const config = (await this.actor.getFlag("axiom-csb", "healthConfig")) || {};
    return {
      healthBonus: config.healthBonus ?? 0,
      damageThreshold: config.damageThreshold ?? 3,
    };
  }

  async _updateObject(event, formData) {
    const configUpdate = {
      healthBonus: parseInt(formData.healthBonus ?? 0),
      damageThreshold: parseInt(formData.damageThreshold ?? 3),
    };

    await this.actor.setFlag("axiom-csb", "healthConfig", configUpdate);
    await this.actor.render();
  }
}
