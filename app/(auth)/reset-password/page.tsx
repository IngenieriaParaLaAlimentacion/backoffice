import ResetPasswordForm from "@/app/(auth)/reset-password/ResetPasswordForm";
import { use } from "react";

type ResetPasswordProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function ResetPassword({ searchParams }: ResetPasswordProps) {
  const { token } = use(searchParams);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground">Create a new password.</p>
      </div>
      <ResetPasswordForm token={token} />
    </>
  );
}
