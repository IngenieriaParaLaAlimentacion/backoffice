import { Stack, Typography } from "@mui/material";
import ResetPasswordForm from "@/app/(auth)/reset-password/ResetPasswordForm";
import { use } from "react";

type ResetPasswordProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function ResetPassword({ searchParams }: ResetPasswordProps) {
  const { token } = use(searchParams);
  return (
    <>
      <Stack spacing={1}>
        <Typography variant="h3" component="h1" align="left">
          Reset Password
        </Typography>
        <Typography>Create a new password.</Typography>
      </Stack>
      <ResetPasswordForm token={token} />
    </>
  );
}
