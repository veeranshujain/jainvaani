# JainVaani Consolidated Update (Phase 1)

Files:
- `attendance_certificates.sql`: creates attendance tables, certificate settings/ledger, RLS, and secure quiz submission RPC.
- `AttendanceFeatures.tsx`: admin attendance + cancellation notice publishing, member cancellation banner, member attendance summary.

## Important integration notes
1. Run the SQL in Supabase SQL Editor only after reviewing it. It is non-destructive to existing app tables/data, but it deliberately drops the two existing direct INSERT policies on `quiz_attempts` and `attempt_answers` because they allow client-side score forgery. Quiz submissions must then go through `submit_jainvaani_quiz`.
2. Copy `AttendanceFeatures.tsx` to `src/AttendanceFeatures.tsx`.
3. Add this import to `src/App.tsx`:
   `import { AttendanceAdmin, MemberAttendance, SwadhyayCancellationBanner } from "./AttendanceFeatures";`
4. Inside the existing Admin `SectionPage` (near `<GranthManager />`, `<SwadhyayManager />`, `<AdminContent />`), add:
   `<AttendanceAdmin />`
5. Render `<SwadhyayCancellationBanner />` on the signed-in home page and `<MemberAttendance />` on a signed-in member-facing page.
6. `ContentFeatures.tsx` already calls `submit_jainvaani_quiz`; after the SQL migration it will resolve to the secure server-side RPC.

## Current scope / not yet included
The migration creates certificate settings and a certificate ledger, but this Phase 1 component does not yet issue or render certificate PDFs. That needs a separate, tested certificate UI and period/eligibility workflow. Do not claim certificates are downloadable until that is implemented.
