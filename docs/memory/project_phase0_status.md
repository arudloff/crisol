---
name: CRISOL phases completion status
description: Current state of CRISOL implementation — Phases 0, 1, and 2 completed 2026-03-31
type: project
---

**Phase 0 (Modularización)** — Completed 2026-03-31
- Monolithic YUNQUE v9.1 (~8888 lines) → 20 ES modules
- Late-bound `state._xxx` pattern, utils.js as barrel

**Phase 1 (Multi-usuario base)** — Completed 2026-03-31
- 5 Supabase tables: profiles, projects, project_members, articles, article_annotations
- Registration + profile completion, projects in Supabase (metadata JSONB)
- Article JSON import, localStorage namespaced per user

**Phase 2 (Colaboración)** — Completed 2026-03-31
- RLS fixed with SECURITY DEFINER helper functions (get_user_project_ids, get_project_member_ids)
- Invitation system: link with token, RPC accept_invitation, auto-join on URL param
- Visual differentiation: shared projects show 👥 + role, edit buttons hidden for non-owners
- Shared article viewing (RLS handles visibility)
- Team members panel in project dashboard
- Notifications table + module (notifications.js), badge 🔔, polling 60s
- accept_invitation RPC auto-notifies project owner

**Supabase tables (7 total)**: profiles, projects, project_members, articles, article_annotations, project_invitations, notifications
**RPC functions**: accept_invitation
**Helper functions**: get_user_project_ids, get_project_member_ids

**Next**: Phase 3 (PRISMA multi-view + visible gates) and Phase 4 (polish)
