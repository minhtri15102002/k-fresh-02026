<!--
Skill: .agents/skills/defect-report
Body skeleton matching .github/ISSUE_TEMPLATE/bug_report.md.
Fill EVERY non-optional section. Anything you cannot fill in,
ask the user — do not invent.
-->

## Summary
{{ONE_SENTENCE_ACTION_ORIENTED_TITLE_AS_FIRST_SENTENCE}}

## Severity
- [{{x_or_space}}] `severity:critical`
- [{{x_or_space}}] `severity:major`
- [{{x_or_space}}] `severity:minor`
- [{{x_or_space}}] `severity:trivial`

## Module
- [{{x_or_space}}] `module:auth`
- [{{x_or_space}}] `module:cart`
- [{{x_or_space}}] `module:checkout`
- [{{x_or_space}}] `module:profile`
- [{{x_or_space}}] `module:product`
- [{{x_or_space}}] `module:compare`
- [{{x_or_space}}] `module:wishlist`
- [{{x_or_space}}] `module:home`

## Environment
| Field | Value |
|---|---|
| Environment | {{ENV: qa / uat / staging / prod / local}} |
| Build / commit | {{BUILD_OR_SHA}} |
| Browser | {{Chromium 130 / Firefox 132 / WebKit 18}} |
| OS | {{macOS 15 / Ubuntu 22.04 / Windows 11}} |
| Viewport | {{1920×1080 / iPhone 14 / etc.}} |
| First seen | {{ISO_TIMESTAMP_OR_CI_RUN_URL}} |

## Steps to reproduce
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. {{OBSERVE_FAILURE}}

## Expected behavior
{{QUOTE_THE_REQUIREMENT_OR_MESSAGES_CONSTANT}}

## Actual behavior
{{QUOTE_THE_ERROR_VERBATIM_OR_DESCRIBE_OBSERVED_STATE}}

```
{{ERROR_STACK_OR_RELEVANT_LOG_EXCERPT_<=_30_LINES}}
```

## Evidence
- {{TRACE_LINK_OR_GIST}}
- {{SCREENSHOT_LINK_OR_ATTACHMENT}}
- {{CI_RUN_URL}}
- {{ALLURE_REPORT_URL}}

## Suspect commit / area (optional)
{{GIT_BLAME_RESULT_OR_RECENT_PR_LINK_OR_BEST_GUESS_FILE}}

## Related test case (optional)
- Spec: `{{tests/.../<file>.spec.ts}}`
- Test ID: `{{TC-...}}`
- Manual TC: `{{documents/manual-testcases/...}}`
- Requirement: `{{REQ-...}}`

## Workaround (optional)
{{IF_USERS_HAVE_A_WORKAROUND_DESCRIBE_IT_HERE_OR_REMOVE_THIS_SECTION}}

## Additional context
{{FEATURE_FLAGS_AB_VARIANTS_RECENT_INFRA_CHANGES_OR_REMOVE_THIS_SECTION}}

---

<sub>Filed via the <code>defect-report</code> skill. Conventions: <a href="../blob/main/prompts/core/defect-labels.md"><code>prompts/core/defect-labels.md</code></a>. The QA Metrics dashboard auto-aggregates this issue once <code>severity:*</code> + <code>module:*</code> labels are applied.</sub>
