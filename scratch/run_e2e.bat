firebase emulators:exec --only auth,firestore,storage --project keeptrip-app-b06b3 "npx playwright test e2e/invitations.spec.ts e2e/kill-switch.spec.ts --workers=1"
