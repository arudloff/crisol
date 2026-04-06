---
name: CRISOL project overview
description: Architecture and stack of CRISOL — modularized research platform evolving from YUNQUE v9.1
type: project
---

CRISOL is a single-page web app for academic researchers to process articles, write documents, manage projects, and track intellectual debt.

**Stack**: Vanilla JS (ES modules), Supabase (auth + DB + RLS + realtime), Vercel deployment.

**Architecture**: index.html (HTML shell) + css/main.css + 19 JS modules in js/ + article data in data/.

**Key pattern**: Cross-module communication uses `state._xxx` late-bound registrations to avoid circular ES module dependencies. `utils.js` acts as barrel module with direct exports + late-bound wrappers.

**Why:** Modularization is Phase 0 of a 4-phase evolution toward a multi-user collaborative platform. Architecture spec at `ARQUITECTURA_CRISOL.md` in parent SILA directory.

**How to apply:** When adding new modules or cross-module features, register functions on `state._xxx` in the provider module and export wrappers from `utils.js`.
