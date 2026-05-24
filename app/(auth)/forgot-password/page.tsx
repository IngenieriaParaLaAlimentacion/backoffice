import { Link, Stack, Typography } from "@mui/material";
import ForgotPasswordForm from "@/app/(auth)/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1">
          Forgot Password
        </Typography>
        <Typography>
          Enter your email and we will send you a link to reset your password.
        </Typography>
      </Stack>
      <ForgotPasswordForm />
      <Link underline="hover" align="center" href="/signin">
        Back to Sign In
      </Link>
    </>
  );
}
