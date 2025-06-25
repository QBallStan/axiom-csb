export async function renderChatCard(data) {
  return await renderTemplate("modules/axiom-csb/templates/chatCard.hbs", data);
}

Handlebars.registerHelper("abs", function (value) {
  return Math.abs(value);
});
