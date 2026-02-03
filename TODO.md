# 🎆 CASEC Spring Gala 2026 — Analysis & TODO
**Last Updated:** 2026-02-03 | **Maintainer:** Synthia

## Current State
- **Repo:** LegalDragon/Casec-project
- **Live:** casecflorida.org / app.casecflorida.org
- **Stack:** .NET Core + React + SQL Server 2014
- **Event Date:** February 25, 2026 (~22 days away)

## Event Details
- **Name:** 2026 Florida Chinese New Year Spring Gala (马年春晚)
- **Venue:** Miramar Cultural Center, Miramar, FL
- **Theme:** 一马当先·光耀世界 (One World, One Brilliant Stage)
- **Headliner:** Joe Wong (黄西) — stand-up comedian
- **Tickets:** etix.com

## ✅ Completed
- [x] Program page (bilingual EN/ZH) at /program/2026-spring-gala
- [x] OG share tags for social media (PR #13-15)
- [x] IIS URL Rewrite for crawler detection (Facebook/Twitter/WhatsApp)
- [x] Raffle Drawing redesign — Prize carousel, 3D flip panels, golden particle bursts, winner overlay, presentation mode, Chinese New Year red/gold theme (PR #16)
- [x] Live Poll page (/live-poll/:pollId) — Video wall display, animated bar charts, 3s real-time polling
- [x] Mobile Voting page (/vote/:pollId) — Phone-only, no account needed, touch-friendly
- [x] Program Rating page (/rate/:eventSlug) — 1-5 stars + comments, phone-based dedup
- [x] Backend: ProgramRatingsController + ProgramRating entity + SQL migration 020
- [x] Anonymous voting support (AllowAnonymous), session cookie dedup

## 🔴 Critical — Before Feb 25
- [ ] **End-to-end testing** — Test poll, vote, and rate pages on actual mobile devices (iOS + Android)
- [ ] **QR codes** — Generate and print QR codes for /vote and /rate pages for audience handouts
- [ ] **Raffle drawing rehearsal** — Full rehearsal with sample prizes and winner data
- [ ] **Load testing** — 500+ concurrent mobile users hitting /vote simultaneously
- [ ] **Backup plan** — What happens if the app goes down during the show? Paper ballots?

## 🟡 Medium — Enhancement
- [ ] **WeChat JS-SDK** — In-app sharing metadata (Feng has Official Account, deferred so far)
- [ ] **Image optimization** — Share card images for OG tags
- [ ] **Gala night monitoring** — Real-time dashboard for organizers to watch votes/ratings come in

## 🟢 Low — Post-Event
- [ ] **Event recap page** — Photos, videos, winner announcements
- [ ] **Rating results** — Publish performer ratings after event
- [ ] **Archive** — Make 2026 gala content accessible for future reference

## Outreach TODO
- [ ] WeChat group blasts
- [ ] Partner org cross-promotion
- [ ] Joe Wong social media promotion
- [ ] Local Chinese business flyers/posters
- [ ] Chinese-language media coverage
- [ ] Facebook groups

## Technical Notes
- **DB:** SQL Server 2014 — no modern SQL features (STRING_AGG, JSON, OPENJSON)
- **Poll system:** SingleChoice/MultipleChoice/Rating types, session cookie dedup
