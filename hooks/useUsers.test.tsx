import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { useUsers } from "@/hooks/useUsers";
import { server } from "@/mocks/server";
import { LIST_USERS_ENDPOINT } from "@/constants/api";
import { DEFAULT_PENDING_USERS_RESPONSE } from "@/mocks/fixtures/admin";

const [USER] = DEFAULT_PENDING_USERS_RESPONSE.items;

function Probe() {
  const { users, page, totalPages, setPage, refetch } = useUsers("analyst", 1);

  return (
    <>
      <button onClick={() => setPage(2)}>next</button>
      <button onClick={refetch}>refetch</button>
      <span data-testid="page">{page}</span>
      <span data-testid="total-pages">{totalPages}</span>
      <span data-testid="users">{users.map((u) => u.id).join(",")}</span>
    </>
  );
}

const text = (testId: string) => screen.getByTestId(testId).textContent;

describe("useUsers", () => {
  it("falls back to the last page when the current one empties out", async () => {
    let totalPages = 2;
    server.use(
      http.get(LIST_USERS_ENDPOINT, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json({
          ...DEFAULT_PENDING_USERS_RESPONSE,
          items: page <= totalPages ? [{ ...USER, id: `user-${page}` }] : [],
          page,
          total_pages: totalPages,
        });
      }),
    );
    renderWithProviders(<Probe />);
    await waitFor(() => expect(text("users")).toBe("user-1"));

    await userEvent.click(screen.getByRole("button", { name: "next" }));
    await waitFor(() => expect(text("users")).toBe("user-2"));

    // The only user on page 2 changed role and left the list.
    totalPages = 1;
    await userEvent.click(screen.getByRole("button", { name: "refetch" }));

    await waitFor(() => expect(text("page")).toBe("1"));
    await waitFor(() => expect(text("users")).toBe("user-1"));
    expect(text("total-pages")).toBe("1");
  });
});
