# AURUM SCAN — PHASE ROADMAP
## Seven phases. Each becomes a full build prompt (SippiLights style) when its turn comes.

App lives in its own new repo (`luxaurum/aurumscan` or similar) from Phase 1. This planning folder is the only thing that touches SippiLights.com.

---

## PHASE 1 — Expo Scaffold + Brand System + Onboarding + Tab Shell
**Goal:** app opens, feels premium, captures the personal risk profile.
- Expo + TypeScript + NativeWind scaffold, EAS configured
- LuxAurum brand token system (dark, gold-accented — tokens file, same discipline as SippiLights)
- Onboarding flow: welcome → what-we-do → build your profile (allergies, pregnancy/nursing, kids, diet rules, sensitivities) → disclaimer acceptance
- Tab shell: Scan · History · Insights · Profile
- Profile stored locally (Supabase wiring lands in Phase 3)
- ✅ Accept: runs on a physical phone via Expo Go/dev build; onboarding produces a stored profile object

## PHASE 2 — Barcode Scanning + Product Lookup + Product Screen
**Goal:** scan a barcode, see the product.
- Camera screen with barcode detection (expo-camera)
- Open Food Facts + Open Beauty Facts lookup with graceful fallback ("No barcode match — try a label photo" stub)
- Product screen v1: image, name, brand, raw ingredient list, "score pending" placeholder
- Local scan history
- ✅ Accept: scan 10 real grocery/cosmetic items; ≥8 resolve to correct product data

## PHASE 3 — Supabase + Ingredient Database + Deterministic Scoring Engine v1
**Goal:** the brain. Scores are computed, cited, and profile-aware.
- Supabase project: auth (anonymous → email upgrade path), RLS
- Schema: `profiles`, `household_members`, `ingredients`, `ingredient_synonyms`, `ingredient_flags` (flag type, severity, source citation, applies-to conditions like pregnancy/child/allergy), `products_cache`, `scans`
- Seed script: FDA additive lists, EU restricted lists, IARC groups, major allergens, common endocrine-disruptor and microplastic-precursor lists
- Rules engine (Edge Function): ingredients × active profile → 0–100 score + flag objects with citations
- Product screen v2: score dial, flag cards with tap-to-expand "why + source"
- ✅ Accept: same product scores differently for a "pregnant" vs "default" profile, and every flag shows a source

## PHASE 4 — AI Label Scan + AI Explanations (Claude via Edge Functions)
**Goal:** the RevealIt killer feature, done better.
- Photo capture → Edge Function → Claude vision → structured ingredient JSON (with confidence; low-confidence triggers "retake" UX)
- Normalization pass against synonyms table → feeds the same Phase 3 rules engine
- Claude explanation layer: 2-paragraph plain-English, profile-aware summary on every product screen
- Result caching per (product, profile-hash) to control API cost
- ✅ Accept: photo-scan a curved shampoo bottle and a boxed food in a real store; correct extraction + personalized cited breakdown. **This is the first shareable TestFlight build.**

## PHASE 5 — Household Mode + Ask-the-Label Chat + Better-Swap Engine
**Goal:** the differentiators nobody else has.
- Multiple household profiles; "scan as" switcher; per-member score chips on one scan
- Chat screen with scan context loaded (Claude, streamed, guardrailed: educational only, provider-referral line on pregnancy/child topics)
- Alternatives engine: 3 cleaner same-category swaps via Open Facts category data + affiliate link wrapper
- ✅ Accept: one scan shows different verdicts for two household members; chat answers product questions with context; flagged product shows 3 swaps

## PHASE 6 — Monetization + History/Insights + Polish
**Goal:** it makes money and retains.
- RevenueCat: free tier (5 scans/day, 1 profile) vs Premium (unlimited, chat, household, swaps, insights); paywall screens; restore purchases
- Insights tab: recurring flagged ingredients, exposure trends, monthly household report
- Empty states, error states, haptics, animations, app icon, splash
- ✅ Accept: sandbox purchase completes on both platforms; gates enforce correctly

## PHASE 7 — Compliance + Store Launch
**Goal:** live in both stores.
- Disclaimer audit (in-app + store listings), privacy policy + data-deletion flow, App Store privacy labels
- Store assets: screenshots, preview video, ASO keyword pass (learn from RevealIt/Yuka listings)
- EAS production builds → TestFlight beta (2 weeks) → submissions to both stores
- PostHog funnels: onboarding completion, scan success rate, paywall conversion
- ✅ Accept: approved and live on the App Store and Google Play

---

### Decisions LuxAurum must make before Phase 1 runs
1. **App name** (trademark + store collision check) — see candidates in master plan §6
2. **New repo name/org** for the app
3. **Apple Developer + Google Play accounts** under LuxAurum Ventures (Apple review takes days — start now)
4. **Anthropic API account** for the Claude integration (Phase 4, but set up early)
5. Brand direction sign-off: dark + gold "LuxAurum luxury-wellness" aesthetic vs clinical clean-white
