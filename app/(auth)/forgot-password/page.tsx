import Link from "next/link";
import ForgotPasswordForm from "@/app/(auth)/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a link to reset your password.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link href="/signin" className="text-sm text-center text-primary hover:underline">
        Back to Sign In
      </Link>
    </>
  );
}
