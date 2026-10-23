import AcceptInviteForm from "@/app/(auth)/invite/AcceptInviteForm";
import { use } from "react";
import { ACCEPT_INVITE_FORM } from "@/constants/auth";

type InviteAnalystPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function InviteAnalystPage({
  searchParams,
}: InviteAnalystPageProps) {
  const { token } = use(searchParams);

  if (!token) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">
          {ACCEPT_INVITE_FORM.invalidLink.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ACCEPT_INVITE_FORM.invalidLink.body}
        </p>
      </div>
    );
  }

  return (
    <AcceptInviteForm
      token={token}
      roleLabel={ACCEPT_INVITE_FORM.roleLabels.analyst}
    />
  );
}
