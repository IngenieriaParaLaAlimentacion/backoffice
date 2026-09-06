import { SubjectSortOrder } from "@/types/subject";

export const SUBJECT_SORT_LABELS: Record<SubjectSortOrder, string> = {
  name_asc: "Nombre A → Z",
  name_desc: "Nombre Z → A",
  birth_date_asc: "Fecha de nacimiento (más antigua)",
  birth_date_desc: "Fecha de nacimiento (más reciente)",
};

export const SUBJECT_RURAL_FILTER_LABELS: Record<
  "" | "true" | "false",
  string
> = {
  "": "Todos",
  true: "Rural",
  false: "No rural",
};

export const SUBJECT_INDIGENOUS_FILTER_LABELS: Record<
  "" | "true" | "false",
  string
> = {
  "": "Todos",
  true: "Sí",
  false: "No",
};

export const SUBJECT_SEX_FILTER_LABELS: Record<"" | "female" | "male", string> =
  {
    "": "Todos",
    female: "Femenino",
    male: "Masculino",
  };

export const SUBJECTS_PAGE = {
  title: "Sujetos",
  subtitle: "Sujetos registrados",
  refresh: "Actualizar",
  search: "Buscar",
  searchPlaceholder: "Nombre, apellido o documento",
  sortLabel: "Ordenar por",
  noSubjects: "No hay sujetos",
  measuredFromAfterToError:
    "La fecha desde no puede ser posterior a la fecha hasta.",
  loadError: "Error al cargar sujetos",
  filters: {
    birthDate: "Fecha de nacimiento",
    from: "Desde",
    to: "Hasta",
    establishment: "Establecimiento",
    allEstablishments: "Todos",
    rural: "Zona rural",
    indigenous: "Población indígena",
    sex: "Sexo",
  },
  columns: {
    name: "Nombre",
    document: "Documento",
    birthDate: "Fecha de nacimiento",
    lastMeasurement: "Último relevamiento",
  },
} as const;

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
