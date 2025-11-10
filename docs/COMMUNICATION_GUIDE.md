# Performance PWA - Communication Guide

## Quick Communication Templates

### Sprint Planning Email

**Subject**: `Sprint [N] Planning - Performance PWA`

**Body**:
```
Hi Team,

Sprint [N] Planning Summary:

**Sprint Goal**: [One sentence goal]

**Focus Area**: [Priority from architecture doc]

**Key Tasks**:
- [Task 1] - [Estimate] - [Assignee]
- [Task 2] - [Estimate] - [Assignee]
- [Task 3] - [Estimate] - [Assignee]

**Reference**: See `/docs/ARCHITECTURE.md` - Priority [X] section for detailed checklists

**Planning Meeting**: [Date/Time] - [Link/Location]

**Questions?** Let's discuss in planning meeting.

Thanks!
[Your Name]
```

---

### Mid-Sprint Check-in Email

**Subject**: `Sprint [N] Mid-Sprint Check-in`

**Body**:
```
Hi Team,

Mid-Sprint [N] Update:

**Progress**: [X]% complete ([X]/[Total] tasks done)

**Completed This Week**:
- ✅ [Task 1]
- ✅ [Task 2]

**In Progress**:
- ⏳ [Task 3] - [Status update]

**Blockers**:
- 🚧 [Blocker description] - [Owner] - [ETA]

**On Track?** ✅ Yes / ⚠️ At Risk / ❌ Behind

**Adjustments Needed?** [Any scope changes or help needed]

**Next Steps**: [What's planned for rest of sprint]

Thanks!
[Your Name]
```

---

### Sprint Review Email

**Subject**: `Sprint [N] Review - [Sprint Name]`

**Body**:
```
Hi Team,

Sprint [N] Review Summary:

**Sprint Goal**: [Goal statement]

**Completed**:
- ✅ [Major accomplishment 1]
- ✅ [Major accomplishment 2]
- ✅ [Major accomplishment 3]

**Demo**: [Link to demo or meeting time]

**Metrics**:
- Tasks Completed: [X] / [Total]
- Velocity: [X] hours
- Blockers Resolved: [X]

**Architecture Doc Updates**: [Link to updated sections]

**Next Sprint Preview**: [Brief preview of Sprint N+1]

**Retrospective**: [Date/Time] - [Link/Location]

Thanks for the great work!
[Your Name]
```

---

### Blocker Escalation Email

**Subject**: `🚧 Blocker: [Brief Description] - Sprint [N]`

**Body**:
```
Hi [Technical Lead/Manager],

**Blocker Summary**: [One sentence]

**Impact**: 
- Blocks: [Task/Feature]
- Affects: [Sprint goal/User story]
- Estimated Delay: [X] days

**Details**:
[Detailed description of the blocker]

**Attempted Solutions**:
- [Solution 1] - [Why it didn't work]
- [Solution 2] - [Why it didn't work]

**Options**:
1. [Option 1] - [Pros/Cons]
2. [Option 2] - [Pros/Cons]
3. [Option 3] - [Pros/Cons]

**Recommendation**: [Your recommendation]

**Next Steps**: [What you need from them]

Thanks!
[Your Name]
```

---

### Feature Completion Announcement

**Subject**: `✅ Feature Complete: [Feature Name]`

**Body**:
```
Hi Team,

**Feature**: [Feature Name]

**Status**: ✅ Complete and deployed

**What's New**:
- [User-facing change 1]
- [User-facing change 2]
- [User-facing change 3]

**Technical Details**:
- [Technical implementation note]
- [Architecture doc updated]: [Link]

**Testing**:
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Accessibility tested
- [ ] Manual QA complete

**Documentation**:
- [ ] User docs updated
- [ ] Architecture doc updated
- [ ] Code comments added

**Next Steps**: [What's next for this feature or related work]

Thanks!
[Your Name]
```

---

### Architecture Decision Record (ADR)

**Template**:
```markdown
# ADR-[Number]: [Decision Title]

**Status**: Proposed / Accepted / Rejected / Deprecated

**Date**: [Date]

**Context**: 
[What is the issue or problem we're addressing?]

**Decision**:
[What decision was made?]

**Consequences**:
**Positive**:
- [Positive consequence 1]
- [Positive consequence 2]

**Negative**:
- [Negative consequence 1]
- [Negative consequence 2]

**Alternatives Considered**:
- [Alternative 1] - [Why rejected]
- [Alternative 2] - [Why rejected]

**References**:
- [Link to discussion/PR/issue]
```

---

## Meeting Agendas

### Sprint Planning Meeting

**Duration**: 1 hour

**Agenda**:
1. **Review Previous Sprint** (10 min)
   - What was completed?
   - What didn't get done?
   - Any carry-over tasks?

2. **Review Architecture Doc Priorities** (10 min)
   - Current priority focus
   - Task checklists available
   - Dependencies identified

3. **Task Breakdown** (30 min)
   - Break features into tasks
   - Estimate effort
   - Assign owners
   - Identify blockers

4. **Sprint Goal Definition** (5 min)
   - Agree on sprint goal
   - Set success criteria

5. **Q&A** (5 min)

**Output**: Sprint plan document, task assignments, sprint goal

---

### Daily Standup

**Duration**: 15 minutes

**Format**: 
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

**Keep It Brief**: 2-3 minutes per person max

---

### Sprint Review

**Duration**: 30-45 minutes

**Agenda**:
1. **Demo Completed Work** (20 min)
   - Show features completed
   - Walk through user flows
   - Highlight technical achievements

2. **Metrics Review** (5 min)
   - Tasks completed
   - Velocity
   - Blockers resolved

3. **Architecture Doc Updates** (5 min)
   - Mark completed items
   - Update status indicators
   - Note any changes

4. **Next Sprint Preview** (5 min)
   - Preview upcoming work
   - Set expectations

**Output**: Updated architecture doc, demo recording (if applicable)

---

### Sprint Retrospective

**Duration**: 30 minutes

**Format**: Start/Stop/Continue

**Agenda**:
1. **What Went Well** (10 min)
   - What should we continue doing?

2. **What Could Improve** (10 min)
   - What should we stop doing?
   - What should we start doing?

3. **Action Items** (10 min)
   - Create action items
   - Assign owners
   - Set deadlines

**Output**: Action items, process improvements

---

## Status Update Templates

### Weekly Status Update (For Stakeholders)

**Format**:
```
**Week of [Date]**

**Completed**:
- [Major accomplishment 1]
- [Major accomplishment 2]

**In Progress**:
- [Current work item]

**Next Week**:
- [Planned work]

**Blockers/Needs**:
- [Any blockers or help needed]

**Metrics**:
- [Relevant metrics]
```

---

### Architecture Doc Update Checklist

When updating the architecture doc:

- [ ] Mark completed tasks with ✅
- [ ] Update status indicators (⏳ → ✅)
- [ ] Add notes on decisions made
- [ ] Update estimates if changed
- [ ] Document any blockers encountered
- [ ] Add new patterns or learnings
- [ ] Update "Last Updated" date

---

## Communication Best Practices

### Do's ✅
- Reference architecture doc in communications
- Use consistent status indicators (✅ ⏳ 📋 🚧)
- Update docs as work progresses
- Share blockers early
- Celebrate wins

### Don'ts ❌
- Don't skip documentation updates
- Don't let blockers sit uncommunicated
- Don't change priorities without discussion
- Don't commit to work without checking architecture doc

---

## Escalation Path

1. **Task Level**: Discuss in daily standup
2. **Sprint Level**: Escalate in mid-sprint check-in
3. **Project Level**: Schedule ad-hoc meeting
4. **Critical Blocker**: Immediate escalation email

---

**Last Updated**: 2024-12-19
