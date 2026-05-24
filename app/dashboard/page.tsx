import { Container, Paper, Stack, Typography } from "@mui/material";

export default function DashboardPage() {
  return (
    <Container maxWidth={false} sx={{ flex: 1, py: 2, display: "flex" }}>
      <Paper elevation={0} sx={{ p: 4, flex: 1 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h3" component="h1">
            Dashboard
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
