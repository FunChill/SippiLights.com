# LUXAURUM VENTURES — INGREDIENT SCANNER APP
## Master Plan (Working codename: AURUM SCAN)

> A LuxAurum Ventures product. Not related to Sippi Lights — this folder lives on a planning branch only and will move to its own repo when the build starts.

---

## 1. WHAT WE'RE BUILDING

An AI-powered product scanner: point your camera at any food, cosmetic, or personal-care product — barcode **or** the ingredient label itself — and instantly get a clear safety breakdown: what's in it, what's flagged, why it's flagged, and what to buy instead.

This was planned before RevealIt existed. RevealIt validated the market. Now we build the version that should exist.

### What RevealIt does (the bar to beat)
- Photo-scan of ingredient lists (AI OCR) — no barcode needed
- Flags "hidden nasties": microplastics, hormone disruptors, allergens, carcinogens
- Ingredient safety score + detailed breakdown
- Educational-only disclaimer positioning

### Where RevealIt (and Yuka, Think Dirty, EWG Healthy Living) fall short
1. **One-size-fits-all scores.** A product scores the same for a pregnant woman, a toddler's parent, and a bodybuilder. Useless nuance lost.
2. **Opaque scoring.** "Score: 34/100" with no citation of *why* or *per whom*.
3. **No conversation.** You get a verdict, not answers. Users have follow-up questions.
4. **Single-user.** Real buyers shop for a household — kids, spouse, elderly parents, pets.
5. **Weak alternatives.** "This is bad" without a great "buy this instead" (which is also the money).
6. **Coverage gaps.** Barcode-only apps die on regional/small-brand products. Photo-scan apps die on curved bottles and glare.

---

## 2. HOW WE BEAT IT — THE 7 DIFFERENTIATORS

1. **Personal Risk Profiles** — onboarding captures allergies, pregnancy/nursing, children's ages, skin conditions, dietary rules (halal, kosher, vegan, keto), and sensitivities. Every score is computed *for that profile*. Same product, different verdict per person. Nobody does this well.
2. **Household Mode** — one account, multiple profiles ("Scan as: Me / Kayla / the baby"). Family plan = built-in premium upsell.
3. **Ask-the-Label AI Chat** — after any scan, chat with the AI about the product: "Is this okay while breastfeeding?" "Which of these three is safest for eczema?" Powered by Claude with the scan context loaded.
4. **Radically Transparent Scoring** — every flag cites its source (FDA, EU/ECHA, IARC, EWG-referenced public data, peer-reviewed summaries) with a one-tap "why" panel. Trust is the moat.
5. **Better-Swap Engine** — every flagged product returns 3 cleaner alternatives in the same category and price band, with affiliate links (Amazon Associates / impact.com). This is a revenue center, not a feature.
6. **Scan Anything** — barcode → instant DB hit; label photo → AI extraction; even menus and handwritten lists. Dual-path means near-100% product coverage.
7. **Exposure Insights** — scan history rolls up into trends: "Your household's top 5 recurring flagged ingredients this month." Retention engine + premium feature.

---

## 3. STACK (mirrors the team's proven stack, adapted for mobile)

| Layer | Choice | Why |
|---|---|---|
| Mobile app | **Expo (React Native) + TypeScript** | Native camera performance, one codebase for iOS + Android, and it's React — the team's existing skill set transfers directly |
| Styling | NativeWind (Tailwind for RN) | Same Tailwind mental model as SippiLights |
| Animation | Moti / Reanimated | Motion-equivalent for RN |
| Backend | **Supabase** (Postgres, Auth, Storage, Edge Functions) | Already proven in-house; RLS for per-user data |
| AI | **Claude API (vision + text)** called *only* from Supabase Edge Functions | Label OCR → structured ingredient JSON; chat; explanations. API key never ships in the app |
| Barcode data | Open Food Facts + Open Beauty Facts APIs (free, ODbL) + USDA FoodData Central | Instant coverage of millions of products at zero cost |
| Ingredient DB | Own curated table in Supabase, seeded from open regulatory lists (FDA additive lists, EU banned/restricted lists, IARC classifications, common allergen registries) | The scoring engine must be **deterministic and citable** — AI extracts and explains, rules score |
| Subscriptions | **RevenueCat** (wraps StoreKit + Google Play Billing) | Stripe can't do mobile IAP; RevenueCat is the industry default. Stripe stays for any future web tier |
| Analytics | PostHog (mobile SDK) | Funnels, retention, feature flags |
| Builds/deploy | EAS Build + EAS Submit + OTA updates | Expo's managed pipeline |

**Critical architecture rule:** the *score* is computed by a deterministic rules engine against our ingredient database (reproducible, defensible, cacheable). Claude's jobs are (a) reading labels into structured data, (b) explaining results in plain language, (c) chat. Never let the LLM invent a score.

### Scan pipeline
```
Camera
 ├─ Barcode detected → Open Food/Beauty Facts lookup → ingredients list
 └─ No barcode / label photo → Edge Function → Claude vision → structured ingredient JSON
        ↓
 Normalize ingredient names (synonyms table: "E621" = "MSG" = "monosodium glutamate")
        ↓
 Rules engine: match against flags DB × active user profile → per-profile score + flag list
        ↓
 Claude explanation layer: plain-English summary, cited, profile-aware
        ↓
 Cache result per (product, profile-hash) in Supabase → instant repeat scans, lower AI cost
```

---

## 4. MONETIZATION

- **Free tier:** 5 scans/day, single profile, basic score + flags.
- **Premium (~$6.99/mo or $49.99/yr):** unlimited scans, AI chat, household profiles, alternatives engine, exposure insights, scan history export.
- **Affiliate revenue:** better-swap links (works on free tier too — free users still monetize).
- **Later:** white-label/API for wellness brands and clinics (LuxAurum B2B angle).

## 5. COMPLIANCE & POSITIONING (non-negotiable)

- Educational/informational tool only. **No medical claims, no diagnosis, no treatment language** — in-app disclaimer, App Store description, and onboarding.
- Cite public data sources; never present AI text as medical advice. Pregnancy/child-related outputs get an extra "consult your provider" line.
- Privacy: health-adjacent profile data stays in Supabase under RLS; publish a real privacy policy; App Store privacy nutrition labels done honestly; delete-account flow at launch (Apple requires it).
- Don't scrape EWG/Yuka databases (licensing). Use open/regulatory sources + our own curation.

## 6. NAMING (decision needed — LuxAurum to choose)

Working codename **AURUM SCAN**. Candidates to trademark-screen: *Aurum Scan, LabelLux, TrueLabel, Lumen Labels, ClearList, VeriPure*. Check USPTO + App Store collisions before Phase 1 branding is finalized.

## 7. BUILD SEQUENCE

Seven phases, each a self-contained build prompt in the SippiLights style — see `01-PHASE-ROADMAP.md`. Phase 1 prompt is already written and ready to run: `PHASE-1-BUILD-PROMPT.md`.

**First real-world milestone:** end of Phase 4 = a TestFlight/internal build where you can photo-scan a real product in a store and get a personalized, cited safety breakdown. Everything after that is depth and money.
