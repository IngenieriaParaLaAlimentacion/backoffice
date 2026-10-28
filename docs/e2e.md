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

The runner downloads two canonical files at the locked public commit, verifies SHA256, pulls the matching backend image, starts PostgreSQL/migrations/catalog/reference seed/backend, builds Next with API8080 and MSWfalse, starts Next3001, runs Chromium and removes its stack/volumes and owned Next process in finally. Files and test output stay under ignored `.context/e2e/`. Runtime credentials are the explicit disposable accounts in `.env.e2e.local`; administrator means admin, not the bootstrap superadmin.

The canonical backend uses in-memory rate-limit counters in its single process; no Redis service is needed.

Local baseline selection forwards Playwright's native `--grep <pattern>` and `--repeat-each <count>` arguments. These are accepted only for a local baseline; CI and stress/quarantine modes reject selection arguments so their coverage cannot be narrowed. Repeated tests share one owned backend/database lifetime but receive fresh browser contexts and unique data.

Example: `npm run e2e -- --grep establishments` runs establishment journeys. A unique full-title pattern selects one case. `npm run e2e -- --grep establishments --repeat-each 2` checks repeated independent records. `npm run e2e -- --repeat-each 2` repeats the entire baseline. Ordinary `npm run e2e:ci` remains the complete baseline plus five strict session proof runs.

## Updating the backend version

`e2e/backend.json` deliberately pins the published image and both canonical source files to one full backend commit. A moving `develop` image could change between runs while the Compose/environment files remain at an older revision. Keeping the image, source commit and SHA256 hashes together makes failures reproducible and exposes backend upgrades in review.

After the backend image publication workflow succeeds for the intended commit, authenticate Docker to the registry and run:

```sh
node e2e/scripts/update-backend.mjs <full-40-character-backend-commit-sha>
git diff -- e2e/backend.json
npm run e2e:ci
```

The update command validates the full SHA, verifies that its published image manifest is readable, downloads `e2e/compose.yml` and `e2e/.env.e2e` from that exact commit, and computes their SHA256 hashes. It writes the manifest only after all checks succeed; it does not pull or start containers. Review the canonical Compose/environment changes between the old and new commits as well as the generated manifest, then commit the upgrade with its complete suite evidence. Do not substitute the moving `develop` tag or guess hashes. Normal test runs keep using the reviewed pin and reject mismatched source bytes.

## Reset and stop

```sh
npm run e2e:reset
# Leaves only this worktree's clean, seeded backend+PostgreSQL ready on8080.
npm run e2e:down
```

Reset reconstructs the dedicated DB from canonical migrations/seeds. It is not a request to re-run the additive seed over mutated fixtures. The ordinary e2e command also starts from a fresh DB and removes it after the suite. A seed re-run does not restore stock, consumed pending requests or changed surveys. No public API cleanup/deletion is invented.

The Compose project is derived from this worktree's real path; the command lock prevents concurrent ownership. The runner only removes that project and its own subprocess groups. It refuses unrelated listeners on8080/3001. Fixed ports mean two worktrees cannot run their E2E commands simultaneously on the same machine. After SIGKILL/power loss, inspect `.context/e2e/command.lock/owner.json`, confirm its PID is dead, remove only that stale lock directory, then run `npm run e2e:down`. Never kill the owner of a port merely because a suite wants it.

## Baseline, stress and CI

```sh
npm run e2e             # Auth, role and business-flow baseline, production build/start.
npm run e2e:stress      # Five fresh PW processes, ten same-role cases each, two workers.
npm run e2e:ci          # One build/stack, baseline followed by all five proof passes.
npm run e2e:quarantine  # Explicit diagnostic selection, outside the baseline.
```

`E2E_STRESS_ROLE=admin` is default; analyst may be selected explicitly for an additional local check. The proof must show ten passed tests, two actual result worker IDs, retries0, no skips/flakies and role-session metadata on each of five passes. A configured worker number or a passing retried test does not satisfy that proof. Each process receives a different run ID and writes a separate report; mutable API names also include that ID.

## Reports

Each invocation creates `.context/e2e/artifacts/<invocation>/`, containing baseline and/or stress1..5 report directories, JSON proof summary and service/build/server logs. Inspect an HTML directory with `npx playwright show-report <path-to-html>` or open its trace from that report. CI uploads these artifacts even after failure, with seven-day retention. There is no production credential or registry-login dump in the artifacts; browser traces do contain disposable session data.

The E2E workflow runs on PRs targeting develop/main, pushes to main and manual dispatch. It remains a non-required check. A fork token unable to pull the private image yields a visible failed prerequisite; it does not trigger a mocked fallback or run with elevated `pull_request_target` credentials. Promotion to required follows the separately documented ten-consecutive-green-develop criterion, using manual dispatch on actualdevelop if no develop push trigger exists.

## Scope and sessions

The baseline covers authentication, administrator/analyst permissions and session stability, plus establishment creation, required-name validation, general editing and analyst characterization, creation-request review, account/access approval and access revocation, FIES-template authoring, status, duplication and analyst response downloads, and manual stock intake, outflow, history and excess-quantity validation. Every mutable establishment, request, field-worker account and survey belongs to one test. Measurement creation, mobile synchronization, mail delivery and real external provider availability remain outside these journeys.

Authenticated tests import `test` from `e2e/fixtures`. Each worker lazily logs in once per role with its own device UUID. Role accounts come from environment variables; admin must be an actual admin. Each test still has a fresh Playwright context. A storageState fixture supplies the latest worker-owned in-memory credentials, and context teardown waits for refreshes and saves current browser storage before closing. No static authentication file is shared across workers or reused after its refresh token has been consumed.

Each test finishes with an observable UI/API assertion. Do not leave asynchronous authenticated navigation running, open multiple authenticated pages in one session, log out or revoke shared fixture credentials. Use the ordinary `@playwright/test` fixture for tests whose subject is login/logout/invalid credentials. A failed authenticated test discards its worker state; the replacement worker performs its own one-time role login. Fixture code never hides a stale-session failure by logging in again.

The inherited `api` helper uses the current scenario browser token and never refreshes independently. Business specs import `test` and `expect` from `e2e/flow-fixtures`; its `flow` helper prepares unique establishments and creation requests through a worker-owned admin session, including for analyst scenarios. The analyst case's separate admin context visits the real dashboard so production auth can refresh, then checkpoints the latest state to that worker session. Scenario assertions use the real UI or `api`, preserving the tested role. Do not create per-test admin API logins, sign tokens, mutate SQL or share mutable seed resources.

Names include the invocation, worker, retry and an intact random UUID. Each case creates its own establishments, pending creation requests, pending field-worker accounts and surveys/responses as needed. Catalog rows are read-only shared references; each stock case owns its establishment, balances and movements. Public registration uses unique `@example.com` emails and requests only the test-owned establishment links; it never logs in the new account. Rerunning the shared seed fills gaps and does not restore modified fixtures; reset/teardown discard the disposable database. No unsupported delete API is used.

The web overlay sets `ENVIRONMENT=development` only for the HTTP backend so newly registered pending field workers are email-verified and visible for admin review. Migration and reference seed retain canonical `e2e`. Email delivery remains disabled and untested.

Only GET requests to `https://apis.datos.gob.ar/georef/api/direcciones` are fulfilled for deterministic address suggestions. Its exact JSON fields drive the real provider; the unique `calle.id` participates in persisted `place_id`. All backend/API calls remain real. List-mode journeys need no map tile interception.

Stock coverage creates real intake and outflow through the UI, then checks the persisted balance and movement history. An excessive outflow is rejected by the current dialog validation: the test checks its visible error, no mutation POST and no new history row. This covers local validation, not the backend's separate concurrent-update HTTP409 race.

The current FIES-template authoring UI omits `instrument_type`, so the survey it creates persists as `custom`. checks its template questions, numbering, status and duplication; it does not claim scoring for that UI-created record. A separate private API-created survey explicitly uses canonical `instrument_type=fies` and owns its responses for analyst read/export checks.

Downloads register both real HTTP-response and browser-download waits before clicking. Filename must equal the server's Content-Disposition filename, and the saved file must be nonempty. CSV actual rows must equal both X-Export-Row-Count and the real filtered listing total. Survey XLSX has no count header: the count-only interpretation counts `Respuestas` rows (excluding its header) against the filtered response-list total, without checking cell values or modifying the API. Cell values are outside the count-only assertions. The test-only fflate dependency extracts the ZIP; browser-native XML parsing finds the named worksheet.

## Locators and Page Objects

Prefer `getByRole` and associated `getByLabel`; use exact accessible names where repeated labels exist. Scope menu links to the visible sidebar and survey actions to the private resource row. Existing unlabeled listing inputs use their meaningful placeholder. `data-testid` is a last resort only when semantics cannot identify an element; these journeys need no new IDs. The Georef placeholder is shared with the provider through a constant without changing its behavior. Use the shared `SignInPage`, `MenuPage` and `SurveyListPage` objects instead of duplicating login/menu mechanics.

Wait for a meaningful heading, loaded row, role-specific control or expected API result. Do not use fixed sleeps, `networkidle`, broad CSS classes or a negative assertion before proving the containing UI has loaded. Distinguish native `window.confirm` from app dialogs. A forbidden backoffice screen is rendered UI, while the backend independently returns HTTP403.

## Stability evidence

The baseline contains thirty-three cases: eight auth, fifteen permission, four establishment, three request, two survey and one stock case; it excludes stress and quarantine tags. The separate `@session-stress` selection contains exactly ten cases. With two actual workers, each case uses a new context, creates a private API record, reloads the real page, observes at least three successful refreshes, confirms two protected reads and rejects replay of the consumed refresh token. Nonsecret `session-proof` attachments report role, worker/parallel index, login count, refresh count and protected-read count; they never contain tokens or passwords.

Acceptance requires five separate successful runs with no retry, failure, flaky result or skip. A command configured with two workers is not evidence that both workers actually executed cases; the runner checks their result metadata. The default same-role proof uses admin; analyst can be selected explicitly with E2E_STRESS_ROLE.

## Quarantine and promotion

Tag a documented unstable test with `@quarantine`; the baseline run excludes that tag and `@session-stress`. Session stress is selected explicitly by its separate proof/CI mode. The same PR must link the tracking issue, name the owner, record the reproduction and explain the temporary exclusion in the test comment. Do not quarantine any authentication/permission/stability acceptance case to report acceptance. Do not add an intentionally failing example, `test.fixme`, silent skip or expected failure to manufacture a green baseline.

The initial suite adds no quarantined cases. Use the quarantine command when a real tagged case exists; an empty selection reports Playwright's no-tests-found result rather than acceptance coverage. Run quarantined cases separately using the documented quarantine command; its failures remain visible in that job/report. Remove the tag once the cause is fixed and the case passes repeatedly under the same parallel mode.

The E2E job is not required initially. Propose making it required only after ten consecutive complete green develop runs with no quarantined acceptance case and no flaky retry being counted as a pass. Include report links and agreement from the maintainers; branch-protection settings are not changed by this PR. A failing non-required job still fails normally: do not use continue-on-error to mislabel failure as success.

The Georef suggestions use legacy `ul/li` markup without option roles. The locator starts from the shared-placeholder input and selects the exact test-owned address from its sibling list. Listbox/option accessibility semantics are a separate change.
