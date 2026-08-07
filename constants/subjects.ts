export const SUBJECT_DETAIL_PANEL = {
  title: "Sujeto",
  loadError: "Error al cargar el sujeto",
  globalScopeLabel: "Último relevamiento (todos los comedores)",

  fields: {
    dni: "Documento de identidad",
    sex: "Sexo",
    male: "Masculino",
    female: "Femenino",
    birthDate: "Fecha de nacimiento",
    isRural: "Población rural",
    isIndigenous: "Población indígena",
    yes: "Sí",
    no: "No",
  },

  latestMeasurement: {
    label: "Último relevamiento",
    date: "Fecha",
    establishment: "Establecimiento",
    weight: "Peso",
    height: "Talla",
    bmi: "IMC",
  },
} as const;
