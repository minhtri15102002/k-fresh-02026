---
name: acceptance-orchestrator
description: "Orchestrates a coding task end-to-end from issue intake through implementation, review, deployment, and acceptance verification with minimal human re-intervention. Use when the user asks to drive a ticket all the way to merged-and-verified, runs ‘take this from spec to production’, or hands the agent a Linear/Jira/GitHub issue and expects autonomous follow-through."
risk: safe
source: community
date_added: "2026-03-12"
---

# Acceptance Orchestrator

## Overview

Orchestrate coding work as a state machine that ends only when acceptance criteria are verified with evidence or the task is explicitly escalated.

Core rule: **do not optimize for "code changed"; optimize for "DoD proven".**

## Required Sub-Skills

- `create-issue-gate`
- `closed-loop-delivery`
- `verification-before-completion`

## Inputs

Require these inputs:
- issue id or issue body
- issue status
- acceptance criteria (DoD)
- target environment (`dev` default)

Fixed defaults:
- max iteration rounds = `2`
- PR review polling = `3m -> 6m -> 10m`

## State Machine

- `intake`
- `issue-gated`
- `executing`
- `review-loop`
- `deploy-verify`
- `accepted`
- `escalated`

## Workflow

1. **Intake** - Read issue and extract task goal + DoD.
2. **Issue gate** - If issue is not `ready`, stop immediately.
3. **Execute** - Hand off to `closed-loop-delivery` for implementation.
4. **Review loop** - Batch polling: wait 3m → 6m → 10m
5. **Deploy and runtime verification** - Verify with real logs/API behavior.
6. **Completion gate** - Require `verification-before-completion`. No success claim without fresh evidence.

## Stop Conditions

Move to `accepted` only when every acceptance criterion has matching evidence.

Move to `escalated` when:
- DoD still fails after `2` full rounds
- missing secrets/permissions blocks progress
- task needs production action or destructive operation approval

## Human Gates

Always stop for human confirmation on:
- prod/stage deploys beyond agreed scope
- destructive git/data operations
- billing or security posture changes

## Output Contract

When reporting status, always include:
- `Status`: intake / executing / accepted / escalated
- `Acceptance Criteria`: pass/fail checklist
- `Evidence`: commands, logs, API results, or runtime proof
- `Open Risks`: anything still uncertain
- `Need Human Input`: smallest next decision, if blocked

Do not report "done" unless status is `accepted`.
