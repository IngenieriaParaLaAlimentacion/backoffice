import SignInForm from "@/app/(auth)/signin/SignInForm";
import Link from "next/link";

export default function SignInPage() {
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-center">Sign In</h1>
      </div>
      <SignInForm />
      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
        Forgot Password?
      </Link>
    </>
  );
}
