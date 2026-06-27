var NOMBRE_HOJA = "Briefings";

function doPost(e) {
  try {
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName(NOMBRE_HOJA) || ss.getActiveSheet();
    var d    = JSON.parse(e.parameter.data);

    if (hoja.getLastRow() === 0) {
      hoja.appendRow([
        "Fecha",
        "Nombre",
        "Teléfono",
        "Instagram",
        "¿Experiencia con agencia?",
        "Describe experiencia",
        "Negocio",
        "Proceso de conversión",
        "Objetivos",
        "Servicios",
        "Marcas de referencia",
        "¿En qué podemos ayudar?",
        "Inversión mensual",
        "Ventas actuales",
        "Cierre de ventas",
        "Fecha de inicio",
        "Información extra"
      ]);

      var cabecera = hoja.getRange(1, 1, 1, 17);
      cabecera.setBackground("#c7ff4a").setFontColor("#10130d").setFontWeight("bold");
      hoja.setFrozenRows(1);
    }

    hoja.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
      d.nombre                  || "",
      d.telefono                || "",
      d.instagram               || "",
      d.experiencia_agencia     || "",
      d.descripcion_experiencia || "",
      d.negocio                 || "",
      d.proceso_cliente         || "",
      join(d.objetivos),
      join(d.servicios),
      d.referencias             || "",
      d.ayuda                   || "",
      d.inversion               || "",
      d.ventas_actuales         || "",
      d.cierre_ventas           || "",
      d.fecha_inicio            || "",
      d.info_extra              || ""
    ]);

    notificar(d);
    return ok();

  } catch (err) {
    return ok();
  }
}

function join(val) {
  if (!val) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}

function notificar(d) {
  try {
    var asunto = "Nuevo brief: " + (d.nombre || "Sin nombre");
    var cuerpo =
      "Nombre: "    + (d.nombre    || "") + "\n" +
      "Teléfono: "  + (d.telefono  || "") + "\n" +
      "Instagram: " + (d.instagram || "") + "\n\n" +
      "Negocio: "   + (d.negocio   || "") + "\n" +
      "Inversión: " + (d.inversion || "") + "\n" +
      "Inicio: "    + (d.fecha_inicio || "") + "\n\n" +
      "Ver hoja: "  + SpreadsheetApp.getActiveSpreadsheet().getUrl();

    MailApp.sendEmail(Session.getActiveUser().getEmail(), asunto, cuerpo);
  } catch (_) {}
}

function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
