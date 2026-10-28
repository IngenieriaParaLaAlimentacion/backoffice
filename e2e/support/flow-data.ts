import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import {
  CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  REGISTER_FIELD_WORKER_ENDPOINT,
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
  SurveyCreateRequest,
  SurveyResponse,
  SurveyTemplateResponse,
} from "../../types/survey";
import { e2eEnv } from "./env";
import { TestData } from "./api-data";

type OwnedWorker = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  password: string;
};

export class FlowData extends TestData {
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
    const response = await this.context.request.post(
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
}
