# Backoffice E2E

The suite controls real Chromium against production Next and the real isolated backend. Browser MSW is forced off for the build and runtime. Shared reference data is supplied by the existing backend Compose; tests create uniquely named own mutable records through API.

## Setup

Requirements: Node24, npm, Docker with Compose v2 (`up --wait` and multiple Compose files), private GHCR package-read access and available localhost ports8080/3001. The backend source repository is public; no source PAT is needed.

```sh
npm ci
npx playwright install --with-deps chromium
cp e2e/.env.example .env.e2e.local
npm run e2e
```

Before the first run, authenticate Docker to GHCR with an account permitted to read the backend package. Use a read:packages credential via Docker's documented stdin/credential helper, never commit it into `.env.e2e.local`. In Actions the consuming repository needs package Actions access and `packages:read`; the standard job token authenticates the registry. The immutable image/source pair in `e2e/backend.json` is the contract. An image-pull failure is a prerequisite failure, not successful browser coverage.

The runner downloads two canonical files at the locked public commit, verifies SHA256, pulls the matching backend image, starts PostgreSQL/migrations/catalog/reference seed/Redis/backend, builds Next with API8080 and MSWfalse, starts Next3001, runs Chromium and removes its stack/volumes and owned Next process in finally. Files and test output stay under ignored `.context/e2e/`. Runtime credentials are the explicit disposable accounts in `.env.e2e.local`; administrator means admin, not the bootstrap superadmin.

Local baseline selection uses `E2E_GREP` (a regular expression matched against full test titles). `E2E_REPEAT=2` repeats every selected test twice inside one owned backend/database lifetime, with fresh per-test contexts and unique fixtures. These controls are rejected in CI and every non-baseline mode; do not persist them in a shared env file. The runner records `selection` and `repeatEach` in its summary.

Example: `E2E_GREP='CA1' npm run e2e` runs the establishment group. A full unique test-title pattern runs that case alone. `E2E_GREP='CA1|CA2' E2E_REPEAT=2 npm run e2e` checks repeated independent records in the same disposable database. `E2E_REPEAT=2 npm run e2e` repeats the entire baseline. Ordinary `npm run e2e:ci` remains the complete baseline plus five strict session proof runs.

## Reset and stop

```sh
npm run e2e:reset
# Leaves only this worktree's clean, seeded backend+PostgreSQL+Redis ready on8080.
npm run e2e:down
```

Reset reconstructs the dedicated DB from canonical migrations/seeds. It is not a request to re-run the additive seed over mutated fixtures. The ordinary e2e command also starts from a fresh DB and removes it after the suite. A seed re-run does not restore stock, consumed pending requests or changed surveys. No public API cleanup/deletion is invented.

The Compose project is derived from this worktree's real path; the command lock prevents concurrent ownership. The runner only removes that project and its own subprocess groups. It refuses unrelated listeners on8080/3001. Fixed ports mean two worktrees cannot run their E2E commands simultaneously on the same machine. After SIGKILL/power loss, inspect `.context/e2e/command.lock/owner.json`, confirm its PID is dead, remove only that stale lock directory, then run `npm run e2e:down`. Never kill the owner of a port merely because a suite wants it.

## Baseline, stress and CI

```sh
npm run e2e             # Auth, role, establishment and request baseline, production build/start.
npm run e2e:stress      # Five fresh PW processes, ten same-role cases each, two workers.
npm run e2e:ci          # One build/stack, baseline followed by all five proof passes.
npm run e2e:quarantine  # Explicit diagnostic selection, outside the baseline.
```

`E2E_STRESS_ROLE=admin` is default; analyst may be selected explicitly for an additional local check. The proof must show ten passed tests, two actual result worker IDs, retries0, no skips/flakies and role-session metadata on each of five passes. A configured worker number or a passing retried test does not satisfy that proof. Each process receives a different run ID and writes a separate report; mutable API names also include that ID.

## Reports

Each invocation creates `.context/e2e/artifacts/<invocation>/`, containing baseline and/or stress1..5 report directories, JSON proof summary and service/build/server logs. Inspect an HTML directory with `npx playwright show-report <path-to-html>` or open its trace from that report. CI uploads these artifacts even after failure, with seven-day retention. There is no production credential or registry-login dump in the artifacts; browser traces do contain disposable session data.

The E2E workflow runs on PRs targeting develop/main, pushes to main and manual dispatch. It remains a non-required check. A fork token unable to pull the private image yields a visible failed prerequisite; it does not trigger a mocked fallback or run with elevated `pull_request_target` credentials. Promotion to required follows the separately documented ten-consecutive-green-develop criterion, using manual dispatch on actualdevelop if no develop push trigger exists.

## Scope and sessions

The baseline covers issue #105 authentication, administrator/analyst permissions and session stability, plus issue #106 CA1 establishment creation, required-name validation, general editing and analyst characterization, and CA2 creation-request review, account/access approval and access revocation. Every mutable establishment, request and field-worker account belongs to one test. API-created questionnaires remain private permission fixtures. Survey CRUD, stock, measurement creation, mobile synchronization, mail delivery and real external provider availability remain outside these journeys.

Authenticated tests import `test` from `e2e/fixtures`. Each worker lazily logs in once per role with its own device UUID. Role accounts come from environment variables; admin must be an actual admin. Each test still has a fresh Playwright context. A storageState fixture supplies the latest worker-owned in-memory credentials, and context teardown waits for refreshes and saves current browser storage before closing. No static authentication file is shared across workers or reused after its refresh token has been consumed.

Each test finishes with an observable UI/API assertion. Do not leave asynchronous authenticated navigation running, open multiple authenticated pages in one session, log out or revoke shared fixture credentials. Use the ordinary `@playwright/test` fixture for tests whose subject is login/logout/invalid credentials. A failed authenticated test discards its worker state; the replacement worker performs its own one-time role login. Fixture code never hides a stale-session failure by logging in again.

The inherited `api` helper uses the current scenario browser token and never refreshes independently. Business specs import `test` and `expect` from `e2e/flow-fixtures`; its `flow` helper prepares unique establishments and creation requests through a worker-owned admin session, including for analyst scenarios. The analyst case's separate admin context visits the real dashboard so production auth can refresh, then checkpoints the latest state to that worker session. Scenario assertions use the real UI or `api`, preserving the tested role. Do not create per-test admin API logins, sign tokens, mutate SQL or share mutable seed resources.

Names include the invocation, worker, retry and an intact random UUID. Each case creates its own establishments, pending creation requests and pending field-worker accounts as needed. Public registration uses unique `@example.com` emails and requests only the test-owned establishment links; it never logs in the new account. Rerunning the shared seed fills gaps and does not restore modified fixtures; reset/teardown discard the disposable database. No unsupported delete API is used.

The web overlay sets `ENVIRONMENT=development` only for the HTTP backend so newly registered pending field workers are email-verified and visible for admin review. Migration and reference seed retain canonical `e2e`. Email delivery remains disabled and untested.

Only GET requests to `https://apis.datos.gob.ar/georef/api/direcciones` are fulfilled for deterministic address suggestions. Its exact JSON fields drive the real provider; the unique `calle.id` participates in persisted `place_id`. All backend/API calls remain real. List-mode journeys need no map tile interception.

## Locators and Page Objects

Prefer `getByRole` and associated `getByLabel`; use exact accessible names where repeated labels exist. Scope menu links to the visible sidebar and survey actions to the private resource row. Existing unlabeled listing inputs use their meaningful placeholder. `data-testid` is a last resort only when semantics cannot identify an element; this issue needs no new IDs or production-component edits. Use the shared `SignInPage` and `MenuPage` objects instead of duplicating login/menu mechanics.

Wait for a meaningful heading, loaded row, role-specific control or expected API result. Do not use fixed sleeps, `networkidle`, broad CSS classes or a negative assertion before proving the containing UI has loaded. Distinguish native `window.confirm` from app dialogs. A forbidden backoffice screen is rendered UI, while the backend independently returns HTTP403.

## Stability evidence

The baseline contains thirty cases: eight auth, fifteen permission, four CA1 establishment and three CA2 request cases; it excludes stress and quarantine tags. The separate `@session-stress` selection contains exactly ten cases. With two actual workers, each case uses a new context, creates a private API record, reloads the real page, observes at least three successful refreshes, confirms two protected reads and rejects replay of the consumed refresh token. Nonsecret `session-proof` attachments report role, worker/parallel index, login count, refresh count and protected-read count; they never contain tokens or passwords.

Acceptance requires five separate successful runs with no retry, failure, flaky result or skip. A command configured with two workers is not evidence that both workers actually executed cases; the runner checks their result metadata. The default same-role proof uses admin; analyst can be selected explicitly with E2E_STRESS_ROLE.

## Quarantine and promotion

Tag a documented unstable test with `@quarantine`; the baseline run excludes that tag and `@session-stress`. Session stress is selected explicitly by its separate proof/CI mode. The same PR must link the tracking issue, name the owner, record the reproduction and explain the temporary exclusion in the test comment. Do not quarantine any authentication/permission/stability acceptance case to call this issue complete. Do not add an intentionally failing example, `test.fixme`, silent skip or expected failure to manufacture a green baseline.

The initial suite adds no quarantined cases. Use the quarantine command when a real tagged case exists; an empty selection reports Playwright's no-tests-found result rather than acceptance coverage. Run quarantined cases separately using the documented quarantine command; its failures remain visible in that job/report. Remove the tag once the cause is fixed and the case passes repeatedly under the same parallel mode.

The E2E job is not required initially. Propose making it required only after ten consecutive complete green develop runs with no quarantined acceptance case and no flaky retry being counted as a pass. Include report links and agreement from the maintainers; branch-protection settings are not changed by this PR. A failing non-required job still fails normally: do not use continue-on-error to mislabel failure as success.
