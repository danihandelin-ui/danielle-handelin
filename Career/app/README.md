# Career Arsenal App

## Overview

This is your personal career tracking application. It helps you:
- Track your progress from operations coordinator to $50/hr + consulting
- Audit your skills
- Set and monitor revenue milestones
- Track learning goals and skill development
- Visualize your 18-month pathway

## How to Use

### Running the App

1. Open `index.html` in your web browser
   - Option 1: Double-click the file
   - Option 2: Drag it into your browser
   - Option 3: Use a local server: `python3 -m http.server` (run in this directory, then go to `localhost:8000`)

2. Start with the **Onboarding** tab to set your baseline and goals
3. Use **Skills Audit** to honestly assess your current skills
4. Fill out **Learning Tracker** to mark progress on the 4 critical skills
5. Update **Revenue Tracker** monthly to monitor earnings progress
6. Check **Dashboard** anytime to see your overall progress

### Tabs Explained

**Dashboard**
- Overview of your progress
- Current vs. target hourly rate
- Skills completed count
- Your position on the pathway timeline

**Onboarding** (Start here!)
- Set your current baseline (job title, years of experience, current hourly rate)
- Define your goals (target hourly rate, consulting model preference, timeline)
- Identify your biggest concern (helpful for staying motivated)

**Skills Audit**
- Rate yourself 0-5 on 24 different skills
- Shows technical, operational, and soft skills
- Use this to identify gaps and celebrate strengths
- Click the circles to rate yourself

**Role Pathway** (18-Month Plan)
- Visual checklist of milestones from now to full consulting
- 4 phases: Prepare, Land Role, Skill Up, Launch Consulting
- Check items off as you complete them

**Learning Tracker** (Progress on 4 Critical Skills)
- Lean Six Sigma Green Belt (CRITICAL)
- Financial Literacy
- Process Mapping & Data Analysis
- Consulting Portfolio
- Check off items as you complete each task

**Revenue Goals**
- Set your targets for each year
- Track actual earnings as you go
- Monitor progress toward $50/hr + consulting

## Data Storage

**Your data is saved locally** in your browser's storage. This means:
- ✅ It's completely private (never uploaded anywhere)
- ✅ You can access it anytime by opening this file
- ✅ It persists between sessions
- ⚠️ If you clear your browser history/cache, you may lose data (backup by exporting)

**To back up your data:**
- Open browser console (F12 or Cmd+Option+I)
- Go to Console tab
- Type: `exportData()` (feature coming soon)
- Copy the output and save to a text file

## Browser Compatibility

Works in any modern browser:
- Chrome/Chromium (Recommended)
- Firefox
- Safari
- Edge

## Customization

You can edit:
- **Skills** in `app.js` under `SKILLS_DATA` (add/remove skills)
- **Milestones** in `index.html` (update Phase 1-4 checkboxes)
- **Colors** in `index.html` under `<style>` (change from purple/blue theme)

## Keyboard Shortcuts

- Click skill circles to rate (0-5 stars)
- Click checkboxes to mark milestones complete
- Tab switching at the top to jump between sections

## Pro Tips

1. **Update monthly:** Add your actual earnings to Revenue Tracker each month
2. **Check learning progress:** Review Learning Tracker weekly as you work on skills
3. **Celebrate milestones:** When you check off a Phase or learning item, celebrate!
4. **Revisit goals:** Come back to Onboarding every 3 months to update your situation and refine goals

## Future Enhancements

Possible additions (you could build these yourself!):
- Export data to PDF
- Charts/graphs of progress over time
- Email reminders for learning milestones
- Integration with calendar for important dates
- Mobile app version
- Notes section for each milestone

## Issues/Questions?

Edit `app.js` or `index.html` directly to add features or modify as needed. This is YOUR tool—make it work for you.

---

**Remember:** This app is just a tracker. The real work happens in the markdown workbooks:
- `01-Reposition.md` - See your actual value
- `02-Skills-Inventory.md` - Understand your skills in market language
- `03-Consulting-Models-Exploration.md` - Figure out what excites you
- `04-Immediate-Next-Role-Analysis.md` - Job search strategy
- `05-Skill-Gaps-&-Learning-Plan.md` - 18-month learning roadmap
- `06-Portfolio-Builder.md` - Document case studies as you work

**This app complements those workbooks.** Use them together.
