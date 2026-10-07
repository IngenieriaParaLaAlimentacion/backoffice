"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/services/auth.service";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { VERIFY_EMAIL_PAGE as COPY } from "@/constants/auth";

type VerifyEmailViewProps = {
  token?: string;
};

type ViewState =
  | { status: "idle"; submitError?: string }
  | { status: "verifying" }
  | { status: "success" }
  | { status: "used" }
  | { status: "failed"; message: string };

const LINK_ERRORS: Record<string, string> = COPY.linkErrors;

/** Final answers about the link end the flow; anything else can be retried. */
function toFailureState(err: unknown): ViewState {
  const type = err instanceof ApiError ? err.type : undefined;

  if (type === ERROR_TYPES.VERIFICATION_TOKEN_USED) return { status: "used" };
  if (type && type in LINK_ERRORS) {
    return { status: "failed", message: LINK_ERRORS[type] };
  }
  return {
    status: "idle",
    submitError: getErrorMessage(err, { fallback: COPY.submitError }),
  };
}

function ScreenHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function SignInPrompt() {
  return (
    <p className="text-sm text-muted-foreground">
      {COPY.signInPrompt}{" "}
      <Link href="/signin" className="text-accent-foreground hover:underline">
        {COPY.signInLink}
      </Link>
    </p>
  );
}

export default function VerifyEmailView({ token }: VerifyEmailViewProps) {
  const [state, setState] = useState<ViewState>({ status: "idle" });
  // The disabled button already blocks a second click; this also holds if two
  // activations land before a render. A second POST would be answered
  // "token used" and replace the success screen.
  const inFlight = useRef(false);

  // The token is single-use and mail scanners open links, so nothing is sent
  // until the person presses the button.
  async function handleVerify() {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setState({ status: "verifying" });

    try {
      await verifyEmailAction(token);
      setState({ status: "success" });
    } catch (err) {
      setState(toFailureState(err));
    } finally {
      inFlight.current = false;
    }
  }

  if (!token) {
    return (
      <ScreenHeading
        title={COPY.missingToken.title}
        description={COPY.missingToken.description}
      />
    );
  }

  if (state.status === "success" || state.status === "used") {
    const { title, description } = COPY[state.status];
    return (
      <div className="flex flex-col gap-6">
        <ScreenHeading title={title} description={description} />
        <Alert>
          <AlertDescription>{COPY.nextSteps}</AlertDescription>
        </Alert>
        <SignInPrompt />
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div className="flex flex-col gap-6">
        <ScreenHeading title={COPY.failed.title} />
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <SignInPrompt />
      </div>
    );
  }

  const isVerifying = state.status === "verifying";
  const submitError = state.status === "idle" ? state.submitError : undefined;

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeading
        title={COPY.landing.title}
        description={COPY.landing.description}
      />
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={isVerifying}
        onClick={handleVerify}
      >
        {isVerifying ? COPY.landing.submitting : COPY.landing.submit}
      </Button>
    </div>
  );
}
