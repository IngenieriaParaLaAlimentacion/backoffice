import { z } from "zod";
import { PROFILE_FORM } from "@/constants/users";
import { PHONE_PATTERN } from "@/schemas/common";

export const PROFILE_TEXT_MAX_LENGTH = 100;
export const PROFILE_PHONE_MAX_LENGTH = 20;
export const PROFILE_DESCRIPTION_MAX_LENGTH = 500;

const COPY = PROFILE_FORM;

/** Blank optional fields reach the API as `null`, so the forms never normalize. */
const optionalText = (field: z.ZodString) =>
  field.nullish().transform((value) => value || null);

const profileText = (max: number) =>
  z.string().trim().max(max, COPY.textMaxLength(max));

export const editProfileSchema = z.object({
  name: profileText(PROFILE_TEXT_MAX_LENGTH).min(1, COPY.nameRequired),
  last_name: profileText(PROFILE_TEXT_MAX_LENGTH).min(1, COPY.lastNameRequired),
  locality: optionalText(profileText(PROFILE_TEXT_MAX_LENGTH)),
  contact_phone: optionalText(
    profileText(PROFILE_PHONE_MAX_LENGTH).regex(
      PHONE_PATTERN,
      COPY.invalidPhone,
    ),
  ),
  description: optionalText(profileText(PROFILE_DESCRIPTION_MAX_LENGTH)),
});

export type EditProfileInput = z.input<typeof editProfileSchema>;
export type EditProfileOutput = z.output<typeof editProfileSchema>;
