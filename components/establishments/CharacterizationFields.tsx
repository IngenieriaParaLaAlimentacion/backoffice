"use client";

import { useId } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  useFormState,
  useWatch,
} from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AFFILIATION_OPTIONS,
  ATTENDEE_AGE_OPTIONS,
  BATHROOM_OPTIONS,
  CARE_TASK_OPTIONS,
  CULTURAL_IDENTITY_OPTIONS,
  ESTABLISHMENT_PROFILE as COPY,
  FOOD_RECEPTION_FREQUENCY_OPTIONS,
  KITCHEN_EQUIPMENT_OPTIONS,
  MEAL_OPTIONS,
  PREMISES_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  SPACE_TYPE_OPTIONS,
  UTILITY_OPTIONS,
  WEEKDAY_INITIALS,
  WEEKDAY_OPTIONS,
} from "@/constants/establishments";
import {
  CharacterizationInput,
  EMPTY_OPENING_HOURS_SLOT,
  OTHER_TEXT_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  PLACE_TEXT_MAX_LENGTH,
} from "@/schemas/establishmentCharacterization.schema";
import { Weekday } from "@/types/establishment";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };
type FormControl = Control<CharacterizationInput>;

const CHIP_CLASS =
  "rounded-full border px-3 py-1 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
const CHIP_ON_CLASS = "border-primary bg-primary text-primary-foreground";
const CHIP_OFF_CLASS = "border-border bg-card hover:bg-muted";
const DAY_CLASS =
  "flex size-8 @sm:size-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
const ERROR_CLASS = "text-sm text-destructive";

/**
 * Toggle chips for one field. Single-choice fields still allow clearing the
 * answer by clicking the chosen chip again — every field is optional, and a
 * radio group offers no way back to "sin responder".
 */
function ChoiceChips<T extends string>({
  options,
  selected,
  onChange,
  multiple,
  disabled,
  labelledBy,
  renderLabel,
  chipClassName,
  className,
}: {
  options: Option<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  multiple: boolean;
  disabled?: boolean;
  labelledBy: string;
  renderLabel?: (option: Option<T>) => React.ReactNode;
  chipClassName?: string;
  className?: string;
}) {
  const toggle = (value: T) => {
    const isOn = selected.includes(value);
    if (multiple)
      onChange(
        isOn ? selected.filter((v) => v !== value) : [...selected, value],
      );
    else onChange(isOn ? [] : [value]);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            aria-label={renderLabel ? option.label : undefined}
            disabled={disabled}
            onClick={() => toggle(option.value)}
            className={cn(
              chipClassName ?? CHIP_CLASS,
              isOn ? CHIP_ON_CLASS : CHIP_OFF_CLASS,
            )}
          >
            {renderLabel ? renderLabel(option) : option.label}
          </button>
        );
      })}
    </div>
  );
}

function DayToggles({
  selected,
  onChange,
  disabled,
  labelledBy,
}: {
  selected: Weekday[];
  onChange: (next: Weekday[]) => void;
  disabled?: boolean;
  labelledBy: string;
}) {
  return (
    <ChoiceChips
      options={WEEKDAY_OPTIONS}
      selected={selected}
      onChange={onChange}
      multiple
      disabled={disabled}
      labelledBy={labelledBy}
      chipClassName={DAY_CLASS}
      className="gap-1 @sm:gap-2"
      renderLabel={(option) => WEEKDAY_INITIALS[option.value]}
    />
  );
}

type Keys<V> = {
  [K in keyof CharacterizationInput]: CharacterizationInput[K] extends V
    ? K
    : never;
}[keyof CharacterizationInput];
type ArrayFieldName = Exclude<Keys<string[]>, "opening_hours">;
type SingleFieldName = "premises" | "bathroom" | "food_reception_frequency";
type OtherFieldName = Extract<Keys<string>, `${string}_other`>;
type TextFieldName = Exclude<Keys<string>, OtherFieldName>;

function Field({
  label,
  labelId,
  hint,
  error,
  children,
}: {
  label: string;
  labelId: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
}

function TextField({
  control,
  name,
  label,
  maxLength,
  hint,
  placeholder,
  type = "text",
  inputMode,
  disabled,
}: {
  control: FormControl;
  name: TextFieldName;
  label: string;
  maxLength?: number;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "numeric";
  disabled?: boolean;
}) {
  const id = useId();
  const { errors } = useFormState({ control, name });
  const error = errors[name]?.message;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            {...field}
            id={id}
            type={type}
            inputMode={inputMode}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        )}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
}

function OtherInput({
  control,
  name,
  label,
  disabled,
}: {
  control: FormControl;
  name: OtherFieldName;
  label: string;
  disabled?: boolean;
}) {
  const { errors } = useFormState({ control, name });
  const error = errors[name]?.message;
  const errorId = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex max-w-sm flex-col gap-1">
          <Input
            {...field}
            aria-label={`${label}: ${COPY.other}`}
            placeholder={COPY.otherPlaceholder}
            maxLength={OTHER_TEXT_MAX_LENGTH}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          {error && (
            <p id={errorId} role="alert" className={ERROR_CLASS}>
              {error}
            </p>
          )}
        </div>
      )}
    />
  );
}

function MultiField<T extends string>({
  control,
  name,
  otherName,
  label,
  options,
  disabled,
}: {
  control: FormControl;
  name: ArrayFieldName;
  otherName?: OtherFieldName;
  label: string;
  options: Option<T>[];
  disabled?: boolean;
}) {
  const labelId = useId();
  const { errors } = useFormState({ control, name });
  const selected = useWatch({ control, name }) as string[];
  return (
    <Field label={label} labelId={labelId} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ChoiceChips
            options={options}
            selected={field.value as T[]}
            onChange={field.onChange}
            multiple
            disabled={disabled}
            labelledBy={labelId}
          />
        )}
      />
      {otherName && selected.includes("other") && (
        <OtherInput
          control={control}
          name={otherName}
          label={label}
          disabled={disabled}
        />
      )}
    </Field>
  );
}

function SingleField<T extends string>({
  control,
  name,
  otherName,
  label,
  options,
  disabled,
}: {
  control: FormControl;
  name: SingleFieldName;
  otherName?: OtherFieldName;
  label: string;
  options: Option<T>[];
  disabled?: boolean;
}) {
  const labelId = useId();
  const { errors } = useFormState({ control, name });
  const value = useWatch({ control, name });
  return (
    <Field label={label} labelId={labelId} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ChoiceChips
            options={options}
            selected={field.value ? [field.value as T] : []}
            onChange={(next) => field.onChange(next[0] ?? null)}
            multiple={false}
            disabled={disabled}
            labelledBy={labelId}
          />
        )}
      />
      {otherName && value === "other" && (
        <OtherInput
          control={control}
          name={otherName}
          label={label}
          disabled={disabled}
        />
      )}
    </Field>
  );
}

/**
 * A list of slots, each with its own days and hours — the referents' form
 * asked this as free text ("lunes a viernes de 12 a 14, sábados de 10 a
 * 12"), which can't be filtered or reused for recipes.
 */
function OpeningHoursField({
  control,
  disabled,
}: {
  control: FormControl;
  disabled?: boolean;
}) {
  const labelId = useId();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "opening_hours",
  });
  const { errors } = useFormState({ control, name: "opening_hours" });
  const H = COPY.hours;

  return (
    <Field
      label={COPY.fields.openingHours}
      labelId={labelId}
      hint={fields.length > 0 ? H.hint : undefined}
    >
      <ul aria-labelledby={labelId} className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const rowErrors = errors.opening_hours?.[index];
          const rowLabel = H.slotLabel(index + 1);
          const daysId = `${labelId}-${index}-days`;
          return (
            <li
              key={field.id}
              aria-label={rowLabel}
              className="@container flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <span id={daysId} className="sr-only">
                  {rowLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <Controller
                    control={control}
                    name={`opening_hours.${index}.days`}
                    render={({ field: days }) => (
                      <DayToggles
                        selected={days.value}
                        onChange={days.onChange}
                        disabled={disabled}
                        labelledBy={daysId}
                      />
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={`${H.removeSlot} ${index + 1}`}
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <X size={16} />
                </Button>
              </div>
              {/* Stacked in a narrow card, side by side from 20rem, inline
                  with their labels from 32rem — sized to the card, not the
                  viewport, since the sidebar changes how wide it is. */}
              <div className="grid gap-3 @xs:grid-cols-2 @lg:flex @lg:flex-wrap @lg:items-center @lg:gap-4">
                {(["opens_at", "closes_at"] as const).map((key) => (
                  <Controller
                    key={key}
                    control={control}
                    name={`opening_hours.${index}.${key}`}
                    render={({ field: time }) => (
                      <label className="flex min-w-0 flex-col gap-1 text-sm @lg:flex-row @lg:items-center @lg:gap-1.5">
                        {key === "opens_at" ? H.opensAt : H.closesAt}
                        <Input
                          {...time}
                          type="time"
                          // 10rem fits the 12-hour "12:00 PM" + clock icon
                          // some browsers render (the format follows the
                          // OS locale); narrower cards just fill the column.
                          className="w-full @lg:w-40"
                          disabled={disabled}
                          aria-invalid={
                            key === "closes_at" && !!rowErrors?.closes_at
                          }
                        />
                      </label>
                    )}
                  />
                ))}
              </div>
              {[rowErrors?.days?.message, rowErrors?.closes_at?.message]
                .filter(Boolean)
                .map((message) => (
                  <p key={message} role="alert" className={ERROR_CLASS}>
                    {message}
                  </p>
                ))}
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => append({ ...EMPTY_OPENING_HOURS_SLOT, days: [] })}
      >
        <Plus size={14} />
        {H.addSlot}
      </Button>
    </Field>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    // `min-w-0`: a fieldset defaults to `min-width: min-content`, so without
    // it the widest row (the opening hours) pushed the whole form off-screen.
    <fieldset className="flex min-w-0 flex-col gap-5 rounded-xl border border-border p-4 md:p-5">
      <legend className="px-1 font-heading text-lg">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * The profile's fields, grouped as the read view groups them. Lives in
 * `components/` rather than beside the Perfil tab because the same block is
 * due in the create, propose and request-review forms (US #92, CA1–CA2).
 */
export default function CharacterizationFields({
  control,
  disabled,
}: {
  control: FormControl;
  disabled?: boolean;
}) {
  const F = COPY.fields;
  const common = { control, disabled };

  return (
    <div className="flex flex-col gap-4">
      <Section title={COPY.sections.location}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            {...common}
            name="district"
            label={F.district}
            maxLength={PLACE_TEXT_MAX_LENGTH}
          />
          <TextField
            {...common}
            name="neighborhood"
            label={F.neighborhood}
            maxLength={PLACE_TEXT_MAX_LENGTH}
          />
          <TextField
            {...common}
            name="cross_streets"
            label={F.crossStreets}
            placeholder={F.crossStreetsPlaceholder}
            maxLength={PLACE_TEXT_MAX_LENGTH}
          />
          <div className="hidden md:block" />
          <TextField
            {...common}
            name="contact_phone"
            label={F.contactPhone}
            type="tel"
            maxLength={PHONE_MAX_LENGTH}
            hint={COPY.privateHint}
          />
          <TextField
            {...common}
            name="contact_email"
            label={F.contactEmail}
            type="email"
          />
        </div>
        <OpeningHoursField {...common} />
      </Section>

      <Section title={COPY.sections.space}>
        <MultiField
          {...common}
          name="space_types"
          otherName="space_types_other"
          label={F.spaceTypes}
          options={SPACE_TYPE_OPTIONS}
        />
        <MultiField
          {...common}
          name="care_tasks"
          otherName="care_tasks_other"
          label={F.careTasks}
          options={CARE_TASK_OPTIONS}
        />
        <SingleField
          {...common}
          name="premises"
          otherName="premises_other"
          label={F.premises}
          options={PREMISES_OPTIONS}
        />
        <SingleField
          {...common}
          name="bathroom"
          otherName="bathroom_other"
          label={F.bathroom}
          options={BATHROOM_OPTIONS}
        />
        <MultiField
          {...common}
          name="utilities"
          label={F.utilities}
          options={UTILITY_OPTIONS}
        />
        <MultiField
          {...common}
          name="affiliations"
          otherName="affiliations_other"
          label={F.affiliations}
          options={AFFILIATION_OPTIONS}
        />
      </Section>

      <Section title={COPY.sections.attendees}>
        <div className="max-w-xs">
          <TextField
            {...common}
            name="daily_attendance"
            label={F.dailyAttendance}
            inputMode="numeric"
          />
        </div>
        <MultiField
          {...common}
          name="attendee_ages"
          label={F.attendeeAges}
          options={ATTENDEE_AGE_OPTIONS}
        />
      </Section>

      <Section title={COPY.sections.food}>
        <MultiField
          {...common}
          name="meals"
          label={F.meals}
          options={MEAL_OPTIONS}
        />
        <MultiField
          {...common}
          name="service_types"
          otherName="service_types_other"
          label={F.serviceTypes}
          options={SERVICE_TYPE_OPTIONS}
        />
        <SingleField
          {...common}
          name="food_reception_frequency"
          label={F.foodReceptionFrequency}
          options={FOOD_RECEPTION_FREQUENCY_OPTIONS}
        />
        <div className="max-w-xs">
          <TextField
            {...common}
            name="cooks_per_service"
            label={F.cooksPerService}
            inputMode="numeric"
          />
        </div>
        <MultiField
          {...common}
          name="kitchen_equipment"
          otherName="kitchen_equipment_other"
          label={F.kitchenEquipment}
          options={KITCHEN_EQUIPMENT_OPTIONS}
        />
      </Section>

      <Section title={COPY.sections.community}>
        <MultiField
          {...common}
          name="cultural_identities"
          otherName="cultural_identities_other"
          label={F.culturalIdentities}
          options={CULTURAL_IDENTITY_OPTIONS}
        />
      </Section>
    </div>
  );
}
