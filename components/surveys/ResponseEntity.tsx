import { EMPTY_VALUE } from "@/lib/format";
import { SubjectRef, EstablishmentRef } from "@/types/survey";

type ResponseEntityProps = {
  subject: SubjectRef | null;
  establishment: EstablishmentRef | null;
};

/**
 * The entity a response is about, read off whichever of subject/establishment
 * the survey's target populates. Both null on anonymous surveys, where the
 * dash is the answer rather than missing data.
 */
export function entityLabel({
  subject,
  establishment,
}: ResponseEntityProps): string {
  if (subject) return `${subject.name} ${subject.last_name}`;
  if (establishment) return establishment.name;
  return EMPTY_VALUE;
}

export default function ResponseEntity({
  subject,
  establishment,
}: ResponseEntityProps) {
  if (subject) {
    return (
      <>
        {subject.name} {subject.last_name}
        <span className="text-muted-foreground"> ({subject.dni})</span>
      </>
    );
  }
  if (establishment) return <>{establishment.name}</>;
  return <span className="text-muted-foreground">{EMPTY_VALUE}</span>;
}
