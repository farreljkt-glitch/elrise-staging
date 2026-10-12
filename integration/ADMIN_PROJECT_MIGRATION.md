# Admin Project staging migration note

This branch adds the fourth Prisma role **ADMIN_PROJECT** and a nullable `User.managedProjectId` relation to `Project`. API endpoints return **only assigned-project employees and attendance**; salary/bank/payroll fields are deliberately omitted.

**Deployment blocker:** There is currently no versioned Prisma migration baseline in this repository. Running `prisma db push` in disposable GitHub Actions is not a production migration strategy. Before applying to an existing `elrise_db`, generate and review a migration against an isolated clone, inspect the MySQL enum change and added FK/index, test backup/rollback, then use a controlled migration deployment.

**Remaining before role is complete:** reviewed admin-project user invitation/provisioning, permission matrix for approval/corrections, real HTTP negative tests with two tenants and two projects. No production role accounts should be created manually to bypass the onboarding flow.
