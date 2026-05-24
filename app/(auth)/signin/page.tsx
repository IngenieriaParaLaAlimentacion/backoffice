import SignInForm from "@/app/(auth)/signin/SignInForm";
import { Link, Stack, Typography } from "@mui/material";

export default function SignInPage() {
  return (
    <>
      <Stack>
        <Typography variant="h3" component="h1" align="center">
          Sign In
        </Typography>
      </Stack>
      <SignInForm />
      <Link underline="hover" href="/forgot-password">
        Forgot Password?
      </Link>
    </>
  );
}
