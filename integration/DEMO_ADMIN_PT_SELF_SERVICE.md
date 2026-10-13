# Elrise demo core flow — Admin PT self-service

Scope: **tenant onboarding -> Admin PT project/admin setup -> employee activation -> GPS+selfie attendance -> scoped approval**. Stop after attendance is validated. No finance, kasbon, payroll, external API, or Gajiku Live changes. PR #33's KasbonRequest and REVIEWED_HOLD remain unchanged.

## UI walkthrough, starting from an existing Superadmin session

An initial Superadmin identity must already exist using the app's established secure bootstrap. This flow **never** asks the operator to edit MySQL, use Prisma Studio, seed a tenant/employee, manually change a role, or alter project IDs.

1. Superadmin signs in and opens **Manajemen Klien** → **Tambah Klien**. Create **PT Demo Indonesia** with a unique code (example `PTDEMO`). Newly created tenants intentionally start with attendance disabled.
2. Superadmin opens **Undangan Admin PT / Admin Project**, selects **PT Demo Indonesia**, role **Admin PT**, name and email `admin@ptdemo.test`. Copy the single-use `/aktivasi-admin?token=...` link and open privately. Set a new password, then login as Admin PT.
3. Admin PT opens **Project PT** (`/admin/project`), creates **SITE-SCBD / Site SCBD**. No Admin Project is needed to create or assign employees.
4. On that Project page, configure **Titik Kantor Project** for Site SCBD. Use **Ambil koordinat lokasi saya** on HTTPS or enter valid GPS coordinates and a 20–1000 m radius; submit explicitly. This enables GPS attendance for the PT while keeping **selfie required**. Do not use fake GPS for real staff.
5. Admin PT opens **Admin Project** (`/admin/admin-project`), selects Site SCBD, invites **Manager SCBD / manager.scbd@ptdemo.test**. Send the resulting single-use Admin Project activation link privately; Manager activates and logs in at `/project/dashboard`.
6. Admin PT opens **Master Pegawai** → **Tambah Pegawai**, selects Site SCBD, creates `EMP001 / Budi Demo / budi@ptdemo.test` with a valid base-salary field (no THP calculation is performed). From the employee list create an activation invitation; Budi activates at `/aktivasi?token=...` and logs in.
7. From a **camera- and GPS-enabled HTTPS browser**, Budi opens **Absensi**, checks in and out near the registered GPS office, with a real selfie. Both writes start with `validatedAt=null`.
8. Manager opens **Admin Project dashboard**, sees only Site SCBD's employees and attendance for the current WIB calendar date, then clicks **Validasi**. The attendance changes to `validatedAt!=null`. Approval twice must be rejected.

## Account separation

- **Superadmin:** tenant creation, Admin PT initial invitation, suspension/reactivation (existing features).
- **Admin PT:** creates project, lists its own projects, invites assigned Admin Project using existing hashed/single-use `AdminInvitation`, creates/imports/assigns/invites employees, sets up tenant's GPS office, reviews attendance.
- **Admin Project:** only its assigned project; no salary/bank fields, tenant management or privilege elevation. Foreign `projectId` selection is denied.
- **Employee:** only their own identity and attendance; no tenant/project management.

## CI acceptance

`integration/scripts/demo-admin-pt-flow-http.cjs` runs against disposable `elrise_ci` MySQL 8. It creates **only a synthetic initial SUPERADMIN bootstrap directly in test DB**; *all other business setup is performed via the same HTTP APIs used by the UI*. It asserts tenant A/B isolation, Admin PT/project invitation escalation rejection, single-use activation, employee invitation, scoped manager team and payroll redaction, office configuration, actual synthetic image upload, check-in/check-out, duplicate rejection and final attendance approval. CI synthetic image is not a real person's photo.

Also retain: Prisma validate/generate, TS typecheck, unit tests, Next build, migrations/drift, existing Q11/Q12 HTTP, and Sprint2 kasbon tests. The `UPLOAD_DIR` in CI is a disposable private folder outside `public`; production must provide a securely configured private absolute path before attendance with required selfie is usable.

## Limitations / STOP

- This is an API + route/UI wiring demo verified by CI, **not** yet a manually observed browser-driven click-through or camera/GPS test on a physical device. Final UAT should check HTTPS browser permissions and genuine proximity/selfie.
- Prior production/local `elrise_db` schema still needs its separate backup/clone/migration history review; CI uses a fresh throwaway database.
- Existing Superadmin bootstrap remains a deployment prerequisite; never create an unauthenticated UI to bootstrap SUPERADMIN.
- Approval is attendance-only, not financial. No Gajiku network calls and no disbursement are introduced.
