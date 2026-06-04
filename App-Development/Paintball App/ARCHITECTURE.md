# Architecture & Design Decisions

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript  
- **Build tool:** Vite  
- **Styling:** Tailwind CSS 4  
- **Animations:** Motion (Framer Motion)  
- **Icons:** Lucide React  

**Current reasoning:**  
_Answer: [Why did you choose these? Any constraints or preferences?]_

### Backend / AI
- **AI Provider:** Google Gemini (genai SDK)  
- **Runtime:** Node.js (Express for API)  

**Current reasoning:**  
_Answer: [Why Gemini? Any plans to swap or add other models?]_

### Storage
- **Client-side:** localStorage (browser persistence)  
- **Scalability plan:** _Answer: [When/if moving to a backend DB, what are requirements?]_

---

## Project Structure

```
src/
  ├── App.tsx              # Main component
  ├── types.ts             # TypeScript interfaces
  ├── data/
  │   └── markerData.ts    # Marker & tips database
  ├── services/
  │   └── ai.ts            # Gemini API calls
  ├── lib/
  │   └── partsSearch.ts   # Shopping list logic
  └── index.css            # Tailwind + globals
```

**Changes to structure:**  
_As we develop, note any new folders/modules we add here._

---

## Key Design Patterns

### State Management
**Current:** React hooks (useState, useMemo, useEffect) at App.tsx level  
**Pain points:** _Answer: [Does this feel limiting? Any refactors you'd like?]_

### Data Flow
1. User selects marker → triggers diagnostic view
2. User describes symptom → calls `diagnoseLeak()` (AI)
3. AI returns structured diagnosis → rendered with steps, parts list
4. User can follow up or save to history

**Desired changes:** _Answer: [Any steps that feel clunky?]_

---

## Known Constraints

### API Limits
- **Gemini quota:** _Answer: [Do you have rate limits? Usage concerns?]_

### Browser Compatibility
- **Target browsers:** _Answer: [Modern browsers only, or legacy support needed?]_

### Mobile / Responsive
- **Current state:** Tailwind responsive classes (mobile-first)  
- **Issues:** _Answer: [Any devices or screen sizes that feel broken?]_

---

## Scaling Considerations (Future)

### When Moving to a Backend
- **User accounts:** Needed? _Answer: [Track user history across devices?]_
- **Database schema:** _Answer: [What data needs persistence beyond localStorage?]_

### Performance
- **Current bottlenecks:** _Answer: [Slow AI calls? Slow renders?]_
- **Optimizations to try:** _Answer: [What's acceptable latency?]_

---

## Decisions to Revisit

_As we build, flag things here that feel like they might need rethinking._
