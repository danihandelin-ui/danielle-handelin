# Feature Specifications

## Implemented Features

### 1. Marker Selection
- **Current:** Browse & search paintball markers by brand, series, category
- **Status:** ✅ Working  
- **Desired improvements:** _Answer: [Any UX issues? Missing markers?]_

### 2. AI Leak Diagnosis
- **Current:** Describe leak location + context → Gemini provides diagnosis, steps, parts list
- **Status:** ✅ Working  
- **Known issues:** _Answer: [False diagnoses? Unhelpful steps?]_
- **Desired improvements:** _Answer: [Better accuracy? Different output format?]_

### 3. Tutorial Videos
- **Current:** YouTube embeds linked to marker data  
- **Status:** ✅ Working  
- **Coverage:** _Answer: [Which markers are missing videos? Priority?]_

### 4. Parts Shopping
- **Current:** Generate copy-paste parts list; link to ANSgear  
- **Status:** ✅ Working  
- **Desired improvements:** _Answer: [Better part matching? Other retailers?]_

### 5. Troubleshooting History
- **Current:** Save past diagnoses to localStorage; view, review, rate  
- **Status:** ✅ Working  
- **Desired improvements:** _Answer: [Export history? Share with techs? Better filtering?]_

### 6. Follow-up Diagnosis
- **Current:** User reports previous steps didn't work; AI suggests alternative causes  
- **Status:** ✅ Working  
- **Desired improvements:** _Answer: [More sophisticated follow-up logic?]_

### 7. Feedback & Ratings
- **Current:** Star rating + optional notes on each diagnosis  
- **Status:** ✅ Working  
- **Desired improvements:** _Answer: [How do you want to use this feedback?]_

---

## Planned / Desired Features

### Feature: ___________
**User need:** _Answer: [What problem does this solve?]_  
**Rough behavior:** _Answer: [How should it work?]_  
**Priority:** Low / Medium / High  
**Blocker on anything?** _Answer: [Yes/No + why]_

---

## Features to Reconsider

_Use this section to flag features that might be nice-to-have but aren't core._

---

## User-Facing Issues

### Issue: ___________
**Symptom:** _Answer: [What do users see/experience?]_  
**Root cause:** _Answer: [If known]_  
**Priority:** Low / Medium / High  

---

## Edge Cases to Handle

- **No internet:** _Answer: [How should the app gracefully degrade?]_
- **AI rate-limited:** Currently handled with fallback message  
- **Marker not in database:** _Answer: [Should we prompt for manual entry?]_
- **User describes unclear symptom:** _Answer: [Prompt for clarification or guess?]_
