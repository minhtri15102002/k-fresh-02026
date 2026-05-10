# Release Brief — v<version> — <YYYY-MM-DD>

> Lab artifact for [Track P · M3](../../training/track-p-people-and-management/p03-communication-and-influence.md) §"Writing the release brief for an executive".
> Audience: VP Eng / CTO / equivalent. ONE PAGE MAX.
> Generated from: [`release-readiness` skill](../../.agents/skills/release-readiness/SKILL.md) data.
>
> Format: BLUF (verdict first), then the 3 things that would change the verdict, then the risks-you're-asking-them-to-accept.

## Verdict: <GO ✅ | CONDITIONAL GO ⚠️ | NO-GO ❌>

<one-sentence summary that answers "what are we doing?" — e.g. "Ship with the cart-promotions feature flag OFF in prod. Re-evaluate Tuesday after the hotfix lands.">

## What would change this verdict

- 🚨 If <condition> → NO-GO
- 🟡 If <condition> → CONDITIONAL → NO-GO
- 🟢 If <condition> → unconditional GO

> Three things, max. The exec needs the conditions of being wrong.

## Risks I'm asking you to accept

> Each risk: what's the impact, who owns the mitigation, what's the early-warning signal.

1. <risk> · impact: <…> · mitigation: <owner + plan> · early-warning: <…>
2. <risk> · impact: <…> · mitigation: <…> · early-warning: <…>

## Risks I'm NOT asking you to accept (the ones we cleared)

- ✅ <e.g. "Open critical defects in checkout: 0 (down from 2 last week)">
- ✅ <e.g. "@P1 pass-rate: 100 %">
- ✅ <…>

## Owners

| Item | Owner | ETA / window |
|---|---|---|
| <e.g. "Hotfix merge"> | @<dev-lead> | Mon 5pm |
| <e.g. "Canary monitor"> | @<sre-on-call> | T+0 → T+4hr |
| <e.g. "Customer comms (if needed)"> | @<pm-name> | within 30 min of trigger |

## Time you need to spend on this

- 🕐 Read time: 2 min
- 🕐 Decision needed by: <YYYY-MM-DD HH:MM>
- 🕐 Re-evaluation point: <when next brief lands>

---

— <your name>, Quality
— Generated from `<reports/release-readiness.md>` at <timestamp>

> Source: [Track P · Module 3](../../training/track-p-people-and-management/p03-communication-and-influence.md) §"Writing the release brief for an executive"
