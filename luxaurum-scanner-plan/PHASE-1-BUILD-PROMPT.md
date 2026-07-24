PHASE 1 — Expo Scaffold + Brand System + Onboarding + Tab Shell

# AURUM SCAN — BUILD PROMPT
## Task: Phase 1 — Project Scaffold, Brand System, Onboarding Flow, 4-Tab Shell
## Branch: main (new repo — NOT SippiLights.com)

---

## CONTEXT
Aurum Scan (working name) is a LuxAurum Ventures mobile app: an AI-powered ingredient scanner for food, cosmetics, and personal-care products. Users scan a barcode or photograph an ingredient label and get a personalized, source-cited safety breakdown. This phase builds the foundation: Expo scaffold, brand token system, the onboarding flow that captures the user's personal risk profile, and the 4-tab app shell. No backend yet — profile persists locally.

## STACK (do not deviate)
- Expo SDK (latest stable) + TypeScript, Expo Router
- NativeWind (Tailwind for React Native)
- Moti + react-native-reanimated for animation
- AsyncStorage for local profile persistence (Supabase arrives in Phase 3)
- EAS configured (eas.json) for dev/preview/production builds
- NO other dependencies without explicit approval

## BRAND SYSTEM — create src/styles/tokens.ts and reference everywhere
- --obsidian: #121212 (primary background)
- --obsidian-2: #1C1C1E (raised surfaces / cards)
- --ivory: #F7F5F0 (primary text)
- --aurum: #C9A227 (accent, CTAs, score highlights — LuxAurum gold)
- --aurum-light: #E6C55C (hover/pressed states)
- --sage: #7FA97A (safe/low-risk indicator)
- --amber-warn: #D98E32 (moderate-risk indicator)
- --signal-red: #C4453C (high-risk indicator)
- --text-muted: rgba(247,245,240,0.55)
- Headline font: Fraunces (Google Fonts) — weights 300, 400, 600
- Body/UI font: Inter — weights 400, 500, 600
- Corners: 10px buttons, 14px cards
- Flat, premium, dark. No decorative shadows. Soft gold radial glows permitted as atmosphere only (scan highlights, score dial).
- Risk colors are ONLY used for risk semantics — never decoration.

## ONBOARDING FLOW (first launch only; Expo Router group /(onboarding))
1. **Welcome** — logo mark placeholder, H1: "Know what's *really* inside." ("really" in aurum italic). Sub: "Scan any food, cosmetic, or personal-care product and see what's in it — explained for you, not everyone." CTA: "Get Started".
2. **How it works** — 3 steps with icons: Scan barcode or label photo → We check every ingredient against public safety data → You get a score built for YOUR profile. CTA: "Build My Profile".
3. **Profile builder** — multi-step, one question per screen, progress bar in aurum:
   - Allergies & sensitivities (multi-select chips: peanuts, tree nuts, dairy, gluten, soy, eggs, shellfish, fragrance, latex, sulfates, + free-text "add your own")
   - Life stage (single-select: none / pregnant / nursing / trying to conceive)
   - Household kids? (none / under 2 / 2–12 / teens — multi-select)
   - Dietary rules (multi-select: vegan, vegetarian, halal, kosher, keto, low-sodium, diabetic-friendly, none)
   - Skin & scalp (multi-select: eczema, acne-prone, sensitive skin, psoriasis, none)
   - Every step skippable ("Skip for now") — profile is editable later in Profile tab.
4. **Disclaimer gate** — "Aurum Scan is an educational tool, not medical advice. Always consult a qualified professional for health decisions." Checkbox + "I Understand" CTA. Cannot proceed without acceptance. Store acceptance timestamp.
5. Persist profile object to AsyncStorage as `profile.v1` (typed interface in src/types/profile.ts) → route to tabs.

## TAB SHELL (Expo Router tabs, all pages get real copy — NO lorem ipsum)
- **Scan** (default) — full-bleed camera placeholder area (dark surface, aurum corner brackets like a viewfinder, soft gold glow center). Copy: "Point at a barcode or ingredient label." Disabled shutter + "Scanning arrives in the next update" chip. Bottom sheet teaser listing the 3 scan modes (Barcode / Label Photo / Ask AI) with lock icons on the latter two.
- **History** — empty state: illustration slot, "No scans yet. Your scanned products will live here." CTA → Scan tab.
- **Insights** — empty state: "Scan a few products and we'll show your household's ingredient trends." Locked-preview card mockup of a trends chart (static).
- **Profile** — shows the saved profile (chips grouped by category), Edit buttons re-opening the relevant onboarding step, household section stub ("Household members — coming soon"), disclaimer re-view link, app version.
- Tab bar: obsidian-2 background, aurum active tint, Inter 500 labels, subtle top hairline at 10% ivory.

## ANIMATION
- Onboarding: fade-up on copy (Moti), progress bar animates width
- Chip selection: scale 0.97 press + aurum border glow on selected
- Tab transitions: default native feel — do not over-animate

## ACCEPTANCE CHECKLIST
- [ ] `npx expo start` runs clean; app loads on a physical device (Expo Go or dev build)
- [ ] TypeScript strict, zero errors; ESLint clean
- [ ] First launch → onboarding; completing it lands on Scan tab; relaunch skips onboarding
- [ ] Profile persists across restarts and renders correctly in Profile tab
- [ ] Disclaimer cannot be bypassed; acceptance timestamp stored
- [ ] All 4 tabs render with real copy and correct brand tokens
- [ ] eas.json present with dev/preview/production profiles
