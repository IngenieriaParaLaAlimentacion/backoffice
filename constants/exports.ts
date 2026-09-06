/** Copy and fallback filenames shared by every listing export. */

export const EXPORT = {
  label: "Exportar CSV",
  exporting: "Exportando…",
  error: "No se pudo exportar el listado",
  interrupted: "La exportación se interrumpió. Volvé a intentar.",
  empty: "No hay datos para exportar",
  closeAria: "Cerrar mensaje",
};

/**
 * Used only when the response carries no `Content-Disposition`: the server
 * normally names the file itself.
 */
export const EXPORT_FILENAMES = {
  establishments: "comedores.csv",
  subjects: "sujetos.csv",
  measurements: "mediciones.csv",
  surveys: "encuestas.csv",
  establishmentSubjects: (establishmentName?: string) =>
    establishmentName
      ? `comedor-${slugify(establishmentName)}-sujetos.csv`
      : "sujetos.csv",
};

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "comedor"
  );
}
