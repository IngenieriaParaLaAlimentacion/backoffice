import { randomInt, randomUUID } from "node:crypto";
import {
  expect,
  type APIResponse,
  type BrowserContext,
  type TestInfo,
} from "@playwright/test";
import {
  CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  FOODS_ENDPOINT,
  MEASUREMENTS_ENDPOINT,
  REGISTER_FIELD_WORKER_ENDPOINT,
  SUBJECTS_ENDPOINT,
  SURVEYS_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEY_RESPONSES_ENDPOINT,
} from "../../constants/api";
import type { ApiMethod } from "../../lib/types";
import type {
  EstablishmentRequestCreationResponse,
  EstablishmentResponse,
} from "../../types/establishment";
import type {
  FoodListItem,
  PaginatedFoodsResponse,
} from "../../types/foodCatalog";
import type { SubjectSummary } from "../../types/subject";
import type {
  SurveyCreateRequest,
  SurveyResponse,
  SurveyTemplateResponse,
} from "../../types/survey";
import { e2eEnv } from "./env";
import { currentTokens } from "./session";

type OwnedSubject = Pick<
  SubjectSummary,
  "id" | "dni" | "name" | "last_name" | "birth_date"
>;

type OwnedFood = Pick<FoodListItem, "id" | "name" | "base_unit">;

type OwnedWorker = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  password: string;
};

export class FlowData {
  private readonly prefix: string;

  constructor(
    private readonly adminContext: BrowserContext,
    info: TestInfo,
  ) {
    const run =
      (process.env.E2E_RUN_ID ?? "local")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .slice(0, 12) || "local";
    this.prefix = `e2e-${run}-w${info.workerIndex}-r${info.retry}`;
  }

  name(label: string, limit = 100): string {
    if (!Number.isInteger(limit) || limit < 40) {
      throw new Error(
        "Unique fixture names require an integer limit of at least 40",
      );
    }
    const suffix = randomUUID().replaceAll("-", "");
    const head = `${this.prefix}-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;
    return `${head.slice(0, limit - suffix.length - 1)}-${suffix}`;
  }

  private async request(
    method: ApiMethod,
    path: string,
    data?: object,
  ): Promise<APIResponse> {
    const tokens = await currentTokens(this.adminContext);
    return this.adminContext.request.fetch(
      new URL(path, e2eEnv.apiURL).toString(),
      {
        method,
        data,
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      },
    );
  }

  private async json<T>(
    method: ApiMethod,
    path: string,
    status: number,
    data?: object,
  ): Promise<T> {
    const response = await this.request(method, path, data);
    expect(response.status(), `fixture ${method} ${path}`).toBe(status);
    return (await response.json()) as T;
  }

  async establishment(label = "establishment"): Promise<EstablishmentResponse> {
    const name = this.name(label);
    const body = {
      name,
      formatted_address: this.name("fictional-address"),
      place_id: this.name("place"),
      latitude: -34.6037,
      longitude: -58.3816,
      city: this.name("city"),
      province: "Ciudad Autónoma de Buenos Aires",
    };
    const created = await this.json<EstablishmentResponse>(
      "POST",
      ESTABLISHMENTS_ENDPOINT,
      201,
      body,
    );
    expect(created.name).toBe(name);
    expect(created.place_id).toBe(body.place_id);
    expect(created.id).toBeTruthy();
    return created;
  }

  async establishmentRequest(
    label = "request",
  ): Promise<
    Pick<
      EstablishmentRequestCreationResponse,
      "id" | "name" | "formatted_address"
    >
  > {
    const body = {
      name: this.name(label),
      formatted_address: this.name("declared-address"),
      city: "Ciudad Autónoma de Buenos Aires",
      province: "Ciudad Autónoma de Buenos Aires",
    };
    const created = await this.json<EstablishmentRequestCreationResponse>(
      "POST",
      CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
      201,
      body,
    );
    expect(created.status).toBe("pending");
    expect(created.name).toBe(body.name);
    return created;
  }

  async fieldWorker(establishmentIds: string[]): Promise<OwnedWorker> {
    const body = {
      email: `${this.name("worker", 60)}@example.com`.toLowerCase(),
      password: "Fictional-E2e-123!",
      name: this.name("Worker"),
      last_name: "E2E",
      establishments: establishmentIds,
    };
    const response = await this.adminContext.request.post(
      new URL(REGISTER_FIELD_WORKER_ENDPOINT, e2eEnv.apiURL).toString(),
      { data: body },
    );
    expect(response.status(), "public pending field-worker registration").toBe(
      201,
    );
    const created = (await response.json()) as Omit<OwnedWorker, "password"> & {
      role: string;
      status: string;
      establishments: string[];
    };
    expect(created.role).toBe("field_worker");
    expect(created.status).toBe("pending_validation");
    expect(created.email).toBe(body.email);
    expect([...created.establishments].sort()).toEqual(
      [...establishmentIds].sort(),
    );
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      last_name: created.last_name,
      password: body.password,
    };
  }

  async fiesWithResponses(
    count = 3,
  ): Promise<{ survey: SurveyResponse; total: number }> {
    if (!Number.isInteger(count) || count < 1 || count > 30) {
      throw new Error("FIES fixture count must be an integer from 1 to 30");
    }
    const template = await this.json<SurveyTemplateResponse>(
      "GET",
      FIES_TEMPLATE_ENDPOINT,
      200,
    );
    const body: SurveyCreateRequest & { instrument_type: "fies" } = {
      name: this.name("fies", 120),
      description: "Fictional scored responses owned by one E2E test",
      response_target: template.response_target,
      requires_response_number: template.requires_response_number,
      instrument_type: "fies",
      questions: [...template.questions]
        .sort((a, b) => a.position - b.position)
        .map((q) => ({
          text: q.text,
          response_type: q.response_type,
          is_required: q.is_required,
          options: [...q.options]
            .sort((a, b) => a.position - b.position)
            .map((o) => ({ text: o.text })),
        })),
    };
    expect(body.response_target).toBe("anonymous");
    const survey = await this.json<SurveyResponse>(
      "POST",
      SURVEYS_ENDPOINT,
      201,
      body,
    );
    const questions = [...survey.questions].sort(
      (a, b) => a.position - b.position,
    );
    expect(questions).toHaveLength(8);
    for (let index = 0; index < count; index += 1) {
      const score = index % 9;
      const answers: Record<string, string> = {};
      for (const [questionIndex, question] of questions.entries()) {
        const options = [...question.options].sort(
          (a, b) => a.position - b.position,
        );
        expect(options).toHaveLength(2);
        answers[question.id] = options[questionIndex < score ? 0 : 1].id;
      }
      const response = await this.json<{ id: string; score_fies: number }>(
        "POST",
        SURVEY_RESPONSES_ENDPOINT(survey.id),
        201,
        {
          id: randomUUID(),
          answers,
          response_number: index + 1,
          event_at: new Date(
            Date.now() - (index + 1) * 86_400_000,
          ).toISOString(),
        },
      );
      expect(response.score_fies).toBe(score);
    }
    const stored = await this.json<SurveyResponse>(
      "GET",
      SURVEY_ENDPOINT(survey.id),
      200,
    );
    expect(stored.response_count).toBe(count);
    return { survey: stored, total: count };
  }

  async food(): Promise<OwnedFood> {
    const result = await this.json<PaginatedFoodsResponse>(
      "GET",
      `${FOODS_ENDPOINT}?page=1&page_size=1&sort_order=name_asc`,
      200,
    );
    expect(result.items).toHaveLength(1);
    const { id, name, base_unit } = result.items[0];
    return { id, name, base_unit };
  }

  async subject(input: {
    birthDate: string;
    name?: string;
    lastName?: string;
  }): Promise<OwnedSubject> {
    const identity = {
      id: randomUUID(),
      name: input.name ?? this.name("Subject"),
      last_name: input.lastName ?? "E2E",
      birth_date: input.birthDate,
      sex: "female",
      is_rural: false,
      is_indigenous: false,
    };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const dni = randomInt(1_000_000, 90_000_000);
      const response = await this.request("POST", SUBJECTS_ENDPOINT, {
        ...identity,
        dni,
      });
      if (response.status() === 409) {
        const problem = (await response.json()) as { type?: string };
        expect(problem.type, "only duplicate DNI is retried").toBe(
          "/errors/subject-already-exists",
        );
        continue;
      }
      expect(response.status(), "create owned subject").toBe(201);
      const created = (await response.json()) as OwnedSubject;
      expect(created.id).toBe(identity.id);
      expect(created.dni).toBe(dni);
      return created;
    }
    throw new Error(
      "Could not reserve a unique fixture DNI after five collisions",
    );
  }

  async measurement(input: {
    subjectId: string;
    establishmentId: string;
    measuredAt: string;
    weightKg?: number;
    heightCm?: number;
  }): Promise<{ id: string }> {
    const id = randomUUID();
    const created = await this.json<{ id: string }>(
      "POST",
      MEASUREMENTS_ENDPOINT,
      201,
      {
        id,
        subject_id: input.subjectId,
        establishment_id: input.establishmentId,
        measured_at: input.measuredAt,
        weight_kg: input.weightKg ?? 20,
        height_cm: input.heightCm ?? 110,
        observation: "Fictional E2E measurement",
      },
    );
    expect(created.id).toBe(id);
    return created;
  }
}
