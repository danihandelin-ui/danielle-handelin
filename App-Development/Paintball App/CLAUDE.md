# Paintball Pocket Tech — Development Guidelines

## Overview
**What is this project?**  
Pocket Tech is an AI-powered web app that diagnoses paintball marker (gun) leaks and failures. Users describe a symptom, the app returns a diagnosis, repair steps, required O-rings/parts, and links to manuals.

**Who is the user?**  
Paintball players (recreational and competitive) who need quick, on-field diagnosis of their markers. They want to avoid trips to the tech shop when possible, or understand what the tech is about to do.

**Core problem it solves:**  
Paintball troubleshooting knowledge is scattered across YouTube, forums, and expensive tech visits. This centralizes it into an ELI5 diagnosis tool powered by Claude AI.

---

## Development Philosophy

### How I Should Work With You
- **Co-create, don't infer.** Ask clarifying questions before building.
- **Reveal as you go.** We'll define requirements in real time during edits, not upfront.
- **Your call on governance.** You approve all architectural decisions, feature scope, and trade-offs.
- **Light by default.** Use Haiku model unless a task is genuinely complex.
- **No .env reads.** I will never read environment files on your machine.

---

## Current State

### What's Working Well
- **Claude API integration.** Fully migrated from Gemini → Claude API. Backend proxy pattern keeps API key secure (server-side only, never exposed to client).
- **Common symptoms quick-pick.** Users can see and click common issues before running diagnosis for their selected marker (5 markers fully populated: CS3, CS2, Geo 5, MXR, DSR).
- **Follow-up diagnosis logic.** If a fix didn't work, the app changes its approach on the second diagnosis instead of repeating itself.
- **Design & UX.** Dark theme, smooth animations (Motion), responsive layout. Looks like a real product.

### Known Issues or Gaps
- **Feedback collection.** Backend sends to Zapier webhook, but data isn't reaching Google Sheets. Likely Zapier field mapping issue (under investigation).
- **Limited marker database.** Only 13 markers (mostly Planet Eclipse + Dye). Missing: Empire, Tippmann, GOG, and others.
- **Cross-device history.** Diagnoses saved only in browser localStorage. No account system or sync across devices.

### Technical Debt
- **Hardcoded O-ring size.** Fixed (now shows actual size from diagnosis), but was hardcoded "013" for weeks.
- **No error boundaries.** Frontend could crash on unexpected API response shape.
- **Manual feedback testing.** Need to verify Zapier→Google Sheets flow works end-to-end.

---

## Product Direction

### Next Priority
1. **Deploy to production** (Vercel frontend + Railway backend) — get it out of localhost
2. **Fix Zapier feedback flow** — data should reach Google Sheets
3. **Add more marker database entries** — expand coverage beyond top 5 brands

### Long-term Vision
A public-facing diagnostic tool trusted by the paintball community. Potential revenue: affiliate links (ANSgear parts sales) or sponsorships from marker brands. Future: offline-first PWA, cross-device history via free accounts, technician-mode for pro shops.

### Non-goals (What NOT to build)
- E-commerce (selling parts directly)
- Community forum or social features
- Video tutorials (link to YouTube instead)
- Support for non-electronic markers (Autocockers, pump guns)

---

## Notes for Future Sessions

### Key Decisions
- **Claude API, not Gemini.** Using claude-sonnet-4-6. Needed because Gemini had early rate limits despite paid tier.
- **Backend proxy pattern.** API key stays server-side (Vercel backend), never in browser bundle.
- **Zapier for feedback, not email.** User wants to avoid email floods; Google Sheet acts as a feedback log (still troubleshooting).
- **Development-only.** Not launching publicly yet. Still in dev phase with localhost testing.

### Known Bugs / Workarounds
- Claude API returns JSON wrapped in markdown code blocks (```json...```). Server strips them before parsing (line 87-90 in server.ts).
- O-ring display was hardcoded "013" for weeks — fixed in App.tsx line 602.
- Common symptoms were empty until we populated markerData.ts for 5 markers.

### Dani's Preferences (For Future Collaborators)
- **Bite-sized updates:** max 3 items per response, linear progress, no overplanning.
- **Co-create, don't infer:** Ask before building, she approves all decisions.
- **No .env reads:** Hard rule. Never read .env files.
- **Use Haiku by default.** Escalate to Sonnet/Opus only when genuinely needed.
- **Update docs frequently.** When context fills (~80%), update CURRENT_STATE.md automatically.
