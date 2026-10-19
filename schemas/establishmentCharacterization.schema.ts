import { z } from "zod";
import { ESTABLISHMENT_PROFILE } from "@/constants/establishments";
import {
  Affiliation,
  AttendeeAge,
  Bathroom,
  CareTask,
  CulturalIdentity,
  EstablishmentCharacterization,
  FoodReceptionFrequency,
  KitchenEquipment,
  Meal,
  OpeningHoursSlot,
  Premises,
  ServiceType,
  SpaceType,
  Utility,
  Weekday,
} from "@/types/establishment";

/** Mirror the backend's bounds so the field, not a vague 422, says what's wrong. */
export const OTHER_TEXT_MAX_LENGTH = 100;
export const PLACE_TEXT_MAX_LENGTH = 100;
export const PHONE_MAX_LENGTH = 30;
export const DAILY_ATTENDANCE_MAX = 100_000;
export const COOKS_PER_SERVICE_MAX = 1_000;

const COPY = ESTABLISHMENT_PROFILE;

const otherText = z
  .string()
  .max(OTHER_TEXT_MAX_LENGTH, COPY.textMaxLength(OTHER_TEXT_MAX_LENGTH));
const placeText = z
  .string()
  .max(PLACE_TEXT_MAX_LENGTH, COPY.textMaxLength(PLACE_TEXT_MAX_LENGTH));

/** A count typed as text: digits only (no "1.500"), up to `max`. */
const wholeNumber = (max: number) =>
  z
    .string()
    .regex(/^\d*$/, COPY.invalidWholeNumber)
    .refine((v) => v === "" || Number(v) <= max, COPY.invalidWholeNumber);

const countOrNull = (text: string) => (text === "" ? null : Number(text));
const countText = (n: number | null) => (n === null ? "" : String(n));

const openingHoursSlotSchema = z
  .object({
    days: z.array(z.custom<Weekday>()),
    opens_at: z.string(),
    closes_at: z.string(),
  })
  .superRefine((slot, ctx) => {
    // A row left completely blank is dropped on save, not an error.
    if (isBlankSlot(slot)) return;
    if (slot.days.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: COPY.hours.daysRequired,
      });
    if (!slot.opens_at || !slot.closes_at)
      ctx.addIssue({
        code: "custom",
        path: ["closes_at"],
        message: COPY.hours.timesRequired,
      });
    // "HH:MM" strings compare correctly as text.
    else if (slot.closes_at <= slot.opens_at)
      ctx.addIssue({
        code: "custom",
        path: ["closes_at"],
        message: COPY.hours.closesBeforeOpens,
      });
  });

/**
 * Form shape: the API's, except free text and the counts are plain
 * strings (`""` when empty) so their inputs stay controlled. Nothing is
 * required — the whole profile may be saved blank (CA5). An opening-hours row
 * left completely blank is skipped by validation and dropped on save, so only
 * a half-filled row is an error.
 */
export const characterizationSchema = z.object({
  district: placeText,
  neighborhood: placeText,
  cross_streets: placeText,
  contact_phone: z
    .string()
    .max(PHONE_MAX_LENGTH, COPY.textMaxLength(PHONE_MAX_LENGTH))
    .regex(/^[\d\s()+-]*$/, COPY.invalidPhone),
  contact_email: z.union([z.literal(""), z.email(COPY.invalidEmail)]),
  opening_hours: z.array(openingHoursSlotSchema),

  space_types: z.array(z.custom<SpaceType>()),
  space_types_other: otherText,
  care_tasks: z.array(z.custom<CareTask>()),
  care_tasks_other: otherText,
  premises: z.custom<Premises | null>(),
  premises_other: otherText,
  bathroom: z.custom<Bathroom | null>(),
  bathroom_other: otherText,
  utilities: z.array(z.custom<Utility>()),
  affiliations: z.array(z.custom<Affiliation>()),
  affiliations_other: otherText,

  daily_attendance: wholeNumber(DAILY_ATTENDANCE_MAX),
  attendee_ages: z.array(z.custom<AttendeeAge>()),

  meals: z.array(z.custom<Meal>()),
  service_types: z.array(z.custom<ServiceType>()),
  service_types_other: otherText,
  food_reception_frequency: z.custom<FoodReceptionFrequency | null>(),
  cooks_per_service: wholeNumber(COOKS_PER_SERVICE_MAX),
  kitchen_equipment: z.array(z.custom<KitchenEquipment>()),
  kitchen_equipment_other: otherText,

  cultural_identities: z.array(z.custom<CulturalIdentity>()),
  cultural_identities_other: otherText,
});
export type CharacterizationInput = z.infer<typeof characterizationSchema>;

export const EMPTY_OPENING_HOURS_SLOT: OpeningHoursSlot = {
  days: [],
  opens_at: "",
  closes_at: "",
};

function isBlankSlot(slot: OpeningHoursSlot) {
  return slot.days.length === 0 && !slot.opens_at && !slot.closes_at;
}

export const EMPTY_CHARACTERIZATION: EstablishmentCharacterization = {
  district: null,
  neighborhood: null,
  cross_streets: null,
  contact_phone: null,
  contact_email: null,
  opening_hours: [],
  space_types: [],
  space_types_other: null,
  care_tasks: [],
  care_tasks_other: null,
  premises: null,
  premises_other: null,
  bathroom: null,
  bathroom_other: null,
  utilities: [],
  affiliations: [],
  affiliations_other: null,
  daily_attendance: null,
  attendee_ages: [],
  meals: [],
  service_types: [],
  service_types_other: null,
  food_reception_frequency: null,
  cooks_per_service: null,
  kitchen_equipment: [],
  kitchen_equipment_other: null,
  cultural_identities: [],
  cultural_identities_other: null,
};

export const toCharacterizationInput = (
  value: EstablishmentCharacterization,
): CharacterizationInput => ({
  ...value,
  district: value.district ?? "",
  neighborhood: value.neighborhood ?? "",
  cross_streets: value.cross_streets ?? "",
  contact_phone: value.contact_phone ?? "",
  contact_email: value.contact_email ?? "",
  space_types_other: value.space_types_other ?? "",
  care_tasks_other: value.care_tasks_other ?? "",
  premises_other: value.premises_other ?? "",
  bathroom_other: value.bathroom_other ?? "",
  affiliations_other: value.affiliations_other ?? "",
  daily_attendance: countText(value.daily_attendance),
  cooks_per_service: countText(value.cooks_per_service),
  kitchen_equipment_other: value.kitchen_equipment_other ?? "",
  service_types_other: value.service_types_other ?? "",
  cultural_identities_other: value.cultural_identities_other ?? "",
});

const textOrNull = (text: string) => text.trim() || null;

/**
 * The backend 422s an `*_other` text sent without "other" chosen, so a text
 * typed and then left behind by unticking "Otro" is dropped here rather than
 * blocking the save.
 */
const keepOther = (chosen: boolean, text: string) =>
  chosen ? textOrNull(text) : null;

export const toCharacterizationRequest = (
  input: CharacterizationInput,
): EstablishmentCharacterization => ({
  ...input,
  district: textOrNull(input.district),
  neighborhood: textOrNull(input.neighborhood),
  cross_streets: textOrNull(input.cross_streets),
  contact_phone: textOrNull(input.contact_phone),
  contact_email: textOrNull(input.contact_email),
  opening_hours: input.opening_hours.filter((slot) => !isBlankSlot(slot)),
  space_types_other: keepOther(
    input.space_types.includes("other"),
    input.space_types_other,
  ),
  care_tasks_other: keepOther(
    input.care_tasks.includes("other"),
    input.care_tasks_other,
  ),
  premises_other: keepOther(input.premises === "other", input.premises_other),
  bathroom_other: keepOther(input.bathroom === "other", input.bathroom_other),
  affiliations_other: keepOther(
    input.affiliations.includes("other"),
    input.affiliations_other,
  ),
  daily_attendance: countOrNull(input.daily_attendance),
  cooks_per_service: countOrNull(input.cooks_per_service),
  kitchen_equipment_other: keepOther(
    input.kitchen_equipment.includes("other"),
    input.kitchen_equipment_other,
  ),
  service_types_other: keepOther(
    input.service_types.includes("other"),
    input.service_types_other,
  ),
  cultural_identities_other: keepOther(
    input.cultural_identities.includes("other"),
    input.cultural_identities_other,
  ),
});

/** Same rule as the backend's computed `characterization_status`. */
export const isCharacterizationEmpty = (value: EstablishmentCharacterization) =>
  Object.values(value).every(
    (field) =>
      field === null ||
      field === "" ||
      (Array.isArray(field) && field.length === 0),
  );
