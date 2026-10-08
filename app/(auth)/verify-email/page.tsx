import { use } from "react";
import VerifyEmailView from "@/app/(auth)/verify-email/VerifyEmailView";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = use(searchParams);

  return <VerifyEmailView token={token} />;
}
