import { Container, Paper } from "@mui/material";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container
      maxWidth={false}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(#6366f1, #9698ff)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          px: 4,
          py: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          width: 400,
        }}
      >
        {children}
      </Paper>
    </Container>
  );
}
