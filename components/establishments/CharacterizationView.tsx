import { Lock } from "lucide-react";
import {
  AFFILIATION_LABELS,
  ATTENDEE_AGE_LABELS,
  BATHROOM_LABELS,
  CARE_TASK_LABELS,
  CULTURAL_IDENTITY_LABELS,
  ESTABLISHMENT_PROFILE as COPY,
  FOOD_RECEPTION_FREQUENCY_LABELS,
  KITCHEN_EQUIPMENT_LABELS,
  MEAL_LABELS,
  PREMISES_LABELS,
  SERVICE_TYPE_LABELS,
  SPACE_TYPE_LABELS,
  UTILITY_LABELS,
} from "@/constants/establishments";
import { DATA_CLASS } from "@/constants/theme";
import {
  EstablishmentCharacterization,
  OpeningHoursSlot,
} from "@/types/establishment";
import { cn } from "@/lib/utils";
import { choiceLabel, formatDays } from "@/lib/characterizationDisplay";

const VALUE_CHIP_CLASS =
  "rounded-full border border-border bg-card px-2.5 py-0.5 text-sm";
const LINK_CLASS = "text-accent-foreground underline-offset-4 hover:underline";

function Chips({ labels }: { labels: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li key={label} className={VALUE_CHIP_CLASS}>
          {label}
        </li>
      ))}
    </ul>
  );
}

function OpeningHours({ slots }: { slots: OpeningHoursSlot[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {slots.map((slot, index) => (
        <li key={index} className="flex flex-wrap gap-x-2">
          <span className="font-medium">{formatDays(slot.days)}</span>
          <span className={DATA_CLASS}>
            {COPY.hours.range(slot.opens_at, slot.closes_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 py-2.5 @lg:grid-cols-[12rem_1fr] @lg:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-border p-4",
        className,
      )}
    >
      <h2 className="text-lg">{title}</h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

const Unanswered = () => (
  <span className="text-muted-foreground italic">{COPY.unanswered}</span>
);

function multi<T extends string>(
  values: T[],
  labels: Record<T, string>,
  otherText: string | null = null,
) {
  return values.length ? (
    <Chips labels={values.map((v) => choiceLabel(v, labels, otherText))} />
  ) : (
    <Unanswered />
  );
}

function single<T extends string>(
  value: T | null,
  labels: Record<T, string>,
  otherText: string | null = null,
) {
  return value ? choiceLabel(value, labels, otherText) : <Unanswered />;
}

const text = (value: string | null) => value ?? <Unanswered />;

const count = (value: number | null) =>
  value === null ? (
    <Unanswered />
  ) : (
    <span className={DATA_CLASS}>{value.toLocaleString("es-AR")}</span>
  );

/**
 * The profile, read-only — in the Perfil tab and in the review of an
 * establishment request. Two columns when there is room; "El espacio" spans
 * both because its option lists are the longest. Unanswered fields stay
 * listed as "Sin responder" so a half-filled profile shows what is missing,
 * not just what is there.
 *
 * Breakpoints are container queries, not viewport ones: the request review
 * is a narrow side panel even on a wide screen.
 */
export default function CharacterizationView({
  characterization: c,
}: {
  characterization: EstablishmentCharacterization;
}) {
  const F = COPY.fields;
  return (
    <div className="@container">
      <div className="grid gap-4 @3xl:grid-cols-2">
        <Section title={COPY.sections.location}>
          <Row label={F.district}>{text(c.district)}</Row>
          <Row label={F.neighborhood}>{text(c.neighborhood)}</Row>
          <Row label={F.crossStreets}>{text(c.cross_streets)}</Row>
          <Row label={F.contactPhone}>
            {c.contact_phone ? (
              <span className="inline-flex items-center gap-1.5">
                <a href={`tel:${c.contact_phone}`} className={LINK_CLASS}>
                  {c.contact_phone}
                </a>
                <Lock
                  size={12}
                  className="text-muted-foreground"
                  aria-label={COPY.privateHint}
                />
              </span>
            ) : (
              <Unanswered />
            )}
          </Row>
          <Row label={F.contactEmail}>
            {c.contact_email ? (
              <a href={`mailto:${c.contact_email}`} className={LINK_CLASS}>
                {c.contact_email}
              </a>
            ) : (
              <Unanswered />
            )}
          </Row>
          <Row label={F.openingHours}>
            {c.opening_hours.length ? (
              <OpeningHours slots={c.opening_hours} />
            ) : (
              <Unanswered />
            )}
          </Row>
        </Section>

        <Section title={COPY.sections.food}>
          <Row label={F.meals}>{multi(c.meals, MEAL_LABELS)}</Row>
          <Row label={F.serviceTypes}>
            {multi(c.service_types, SERVICE_TYPE_LABELS, c.service_types_other)}
          </Row>
          <Row label={F.foodReceptionFrequency}>
            {single(
              c.food_reception_frequency,
              FOOD_RECEPTION_FREQUENCY_LABELS,
            )}
          </Row>
          <Row label={F.cooksPerService}>{count(c.cooks_per_service)}</Row>
          <Row label={F.kitchenEquipment}>
            {multi(
              c.kitchen_equipment,
              KITCHEN_EQUIPMENT_LABELS,
              c.kitchen_equipment_other,
            )}
          </Row>
        </Section>

        <Section title={COPY.sections.space} className="@3xl:col-span-2">
          <Row label={F.spaceTypes}>
            {multi(c.space_types, SPACE_TYPE_LABELS, c.space_types_other)}
          </Row>
          <Row label={F.careTasks}>
            {multi(c.care_tasks, CARE_TASK_LABELS, c.care_tasks_other)}
          </Row>
          <Row label={F.premises}>
            {single(c.premises, PREMISES_LABELS, c.premises_other)}
          </Row>
          <Row label={F.bathroom}>
            {single(c.bathroom, BATHROOM_LABELS, c.bathroom_other)}
          </Row>
          <Row label={F.utilities}>{multi(c.utilities, UTILITY_LABELS)}</Row>
          <Row label={F.affiliations}>
            {multi(c.affiliations, AFFILIATION_LABELS, c.affiliations_other)}
          </Row>
        </Section>

        <Section title={COPY.sections.attendees}>
          <Row label={F.dailyAttendance}>{count(c.daily_attendance)}</Row>
          <Row label={F.attendeeAges}>
            {multi(c.attendee_ages, ATTENDEE_AGE_LABELS)}
          </Row>
        </Section>

        <Section title={COPY.sections.community}>
          <Row label={F.culturalIdentities}>
            {multi(
              c.cultural_identities,
              CULTURAL_IDENTITY_LABELS,
              c.cultural_identities_other,
            )}
          </Row>
        </Section>
      </div>
    </div>
  );
}
