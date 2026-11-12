# Spaced repetition – changes for front

Nov 10, 2026 · @Abd Elwahab Sewalam

## POST /api/spaced-repetition/start

**Who:** registered user · guest (any signed-in account) · **Changed:** two new reply fields

### Brief

The reply now also says when the review is due and whether today is still before that day, so the site can warn the student before the quiz that finishing now won't count. It never blocks.

### Fields

| Body field | Required | Meaning |
| --- | --- | --- |
| subjectId | yes | The lesson's subject id (unchanged) |
| lessonId | yes | The lesson id (unchanged) |
| category | yes | The Arabic category text, e.g. `أساسيات` (unchanged) |

| New reply field | Type | Meaning |
| --- | --- | --- |
| dueDate | datetime? (UTC) | The review's due date. Null on a first study (no plan yet) |
| isEarly | bool | Today is before the due day in the student's country: finishing every question now completes the session but doesn't move the plan |

### Valid cases

**Review not due yet:**

```json
POST /api/spaced-repetition/start
{ "subjectId": 1, "lessonId": 23, "category": "أساسيات" }

{ "id": 170, "subjectId": 1, "lessonId": 23, "category": "أساسيات",
  "repetitionNumber": 1, "status": 0, "startTime": "2026-11-10T21:09:01Z", "endTime": null,
  "correctAnswersCount": 0, "totalQuestionsCount": 0, "finishedQuestionIds": [],
  "dueDate": "2026-11-11T21:08:51", "isEarly": true }
```

**Due today or late:** the same shape with `"isEarly": false`.

**First study of the lesson:** `"repetitionNumber": 0`, `"dueDate": null`, `"isEarly": false`.

### Bad cases

| Send | Get | Show |
| --- | --- | --- |
| No token | 401 `unauthorized` | يرجى تسجيل الدخول مرة أخرى |
| A guest who used all free reviews | 403, `code: guest_limit_reached`, `feature: spaced-repetition` | انتهت مراجعاتك المجانية. أنشئ حسابك للمتابعة |
| The plan's review sessions are used up | 403, `code: quota_exhausted` | لقد استنفدت مراجعات خطتك |
| The plan has review sessions off | 403, `code: not_in_plan` | خطتك لا تشمل هذه الميزة |

### Lookups and dependencies

- `GET /api/questions/session-questions?lessonId=&category=` gives the questions for the sitting, as before.
- `POST /api/spaced-repetition/end` (the next card) ends the sitting and decides whether it counted.

### Notes

- When `isEarly = true`, show a note before the first question, for example: "هذه المراجعة موعدها {dueDate} — إنهاؤها الآن لن يُحسب حتى ذلك اليوم". The student can still go on and practise.
- Show `dueDate` as a date in the student's local time; it is sent in UTC.

## POST /api/spaced-repetition/end

&#32;**Changed:** a review counts only from its due day

### Brief

the reply says `isEarly: true`.

### Fields

| Body field | Required | Meaning |
| --- | --- | --- |
| sessionId | yes | The id from `/start` (unchanged) |
| correctAnswersCount | yes | Correct answers in this sitting (unchanged) |
| totalQuestionsCount | yes | Questions answered in this sitting (unchanged) |
| endTime | yes | When the sitting ended, ISO date (unchanged) |
| finishedQuestionIds | yes | The `informationID`s finished in this sitting (unchanged) |

| Reply field | Type | Meaning |
| --- | --- | --- |
| lessonCompleted | bool | Every question is finished in this round (unchanged) |
| remainingQuestions | int | Questions still to do in this round (unchanged) |
| isEarly | bool | **New.** All finished, but before the due day: the plan did **not** move, and the questions are open again |
| daysEarly | int | **New.** Days before the due day; 0 when not early |
| daysLate | int | **New.** Days after the due day; 0 when on time |
| nextRepetitionNumber | int? | The review the plan is on now; when early, the same one as before |
| nextReviewDate | datetime? (UTC) | The plan's real due date: the **unchanged** date when early, the new date when counted, null after the last review |
| intervalsSource | string? | **New.** Where the gap came from when the plan moved: `subject`, `default`, `system`, or `systemPlanLimit` (own intervals saved but not in the plan) |

### Valid cases

**Not finished yet:**

```json
{ "success": true, "message": "7 questions left.",
  "data": { "sessionId": 171, "lessonCompleted": false, "remainingQuestions": 7, "isEarly": false,
            "daysEarly": 0, "daysLate": 0, "nextRepetitionNumber": null, "nextReviewDate": null, "intervalsSource": null } }
```

**All finished early (plan stays on review 1):**

```json
{ "success": true,
  "message": "All questions done 1 day early, so this doesn't count yet. Review 1 is due on 11 Nov 2026. The questions are open again for practice.",
  "data": { "sessionId": 170, "lessonCompleted": true, "remainingQuestions": 0, "isEarly": true,
            "daysEarly": 1, "daysLate": 0, "nextRepetitionNumber": 1, "nextReviewDate": "2026-11-11T21:08:51", "intervalsSource": null } }
```

**Review counted:**

```json
{ "success": true,
  "message": "Review 1 done. Next review on 17 Nov 2026. Your plan doesn't include your own intervals, so the default schedule was used.",
  "data": { "sessionId": 172, "lessonCompleted": true, "remainingQuestions": 0, "isEarly": false,
            "daysEarly": 0, "daysLate": 0, "nextRepetitionNumber": 2, "nextReviewDate": "2026-11-17T21:10:21", "intervalsSource": "systemPlanLimit" } }
```

**Late review:** the same as counted, with `daysLate` > 0 and a message like "Review 2 done 3 days late; it counts. Next review on …".

**Last review done:** `nextReviewDate: null`, message "All reviews done."

### Bad cases

| Send | Get | Show |
| --- | --- | --- |
| No token | 401 `unauthorized` | يرجى تسجيل الدخول مرة أخرى |
| A `sessionId` that doesn't exist or is another user's | 404, "Session not found or unauthorized." | العنصر المطلوب غير موجود |

### Lookups and dependencies

- `sessionId` comes from `POST /api/spaced-repetition/start`.
- `finishedQuestionIds` are the `informationID`s from `GET /api/questions/session-questions`.
- `POST /api/spaced-repetition/restart` ("ابدأ من جديد") clears the round's progress, as before.

### Notes

- **Read this reply.** Today the site ignores it. Now "all questions done" no longer always means "review done", so the screen must follow the fields:
  1. `lessonCompleted = false`: "باقي {remainingQuestions} أسئلة".
  2. `lessonCompleted = true` and `isEarly = true`: finished early, the review is still on `nextReviewDate`, and the questions are open again for practice.
  3. `lessonCompleted = true` and `isEarly = false`: review done, the next one on `nextReviewDate`. If `daysLate` > 0, say it was late but still counts. `nextReviewDate = null` means all reviews are done.

## GET /api/user-preferences/spaced-repetition/intervals

**Changed:** two new reply fields; saved intervals now apply only when the plan includes them

### Brief

### Fields

No query or body.

| New reply field | Type | Meaning |
| --- | --- | --- |
| customIntervalsAllowed | bool | The student's plan includes their own intervals |
| appliedIntervalsNote | string? | A line to show when `customIntervalsAllowed = false`; null otherwise |

### Valid cases

**Plan without custom intervals, a subject override saved:**

```json
{ "success": true, "message": "Review intervals retrieved successfully.", "data": {
  "defaultIntervals": [], "systemIntervals": [1, 7, 10, 30], "maxRepetitions": 4,
  "subjects": [ { "subjectId": 1, "subjectName": "الرياضيات", "intervals": [2, 3, 4, 5], "source": "subject" } ],
  "customIntervalsAllowed": false,
  "appliedIntervalsNote": "Your plan doesn't include custom intervals, so the default 1, 7, 10, 30 applies. Your saved intervals come back when you upgrade." } }
```

**Plan without custom intervals, nothing saved:** the note ends after "… 1, 7, 10, 30 applies."

**Plan with custom intervals:** `"customIntervalsAllowed": true`, `"appliedIntervalsNote": null`.

### Bad cases

| Send | Get | Show |
| --- | --- | --- |
| No token | 401 `unauthorized` | يرجى تسجيل الدخول مرة أخرى |
| `PUT …/intervals` or `PUT …/intervals/{subjectId}` on a plan without custom intervals | 403 `not_in_plan` (unchanged) | خطتك لا تشمل الفترات المخصصة + an upgrade link |
| `PUT` with no intervals, more than 4, or a day outside the allowed range | 400 with the reason (unchanged) | القيمة المدخلة غير صحيحة |

### Lookups and dependencies

- `PUT /api/user-preferences/spaced-repetition/intervals` and `PUT …/intervals/{subjectId}` save intervals; both are refused on such a plan.
- `DELETE` on the same two routes resets to the default; free on every plan.
- `POST /api/spaced-repetition/end` reports `intervalsSource: systemPlanLimit` when this rule picked the gap.

### Notes

- When `customIntervalsAllowed = false`, show the note (in Arabic) with an upgrade link. The saved intervals can still be listed, marked as not applied.
- ## On a 403 `not_in_plan` from a save, show the plan message with an upgrade link, not a general error.\
\
\
\
\
\
POST /api/spaced-repetition/set-plan/{sessionId}

  ## **Who:** nobody · **Changed:** removed\
\
\
\
\
\


## GET /api/spaced-repetition/plans/filter

**Who:** registered user · guest · **Changed:** no new fields; two site calls to fix, and one backend fix

### Brief

The calls below were read from the live site on 11 Nov 2026. Two calls on /subjects cut reviews off at 7 days. The bigger problem is in the backend: the dates are read as UTC days, so some reviews vanish from both tabs on their own due day.

### How the site calls it now

| Page · tab | Call now | Problem | Fix |
| --- | --- | --- | --- |
| /subjects · فائتة (Missed) | `?status=2&startDate=<today−7>&endDate=<today>` | A review missed more than 7 days ago never shows here | `?status=2&endDate=<today>`, no `startDate` |
| /subjects · قادمة (Coming) | `?status=1&startDate=<today>&endDate=<today+7>` | A review due more than 7 days ahead doesn't show, e.g. after a 10- or 30-day gap | Drop `endDate` if the tab means all coming reviews; keep it only if "this week" is intended, and label the tab so |
| /spaced-repetition | Three calls: `status=1`, `2`, `3`, each `startDate=2000-01-01` | Works; three requests where one would do | Optional: one call `?status=0&startDate=2000-01-01`, split by `status` on the site |

### The bigger problem (backend) — fixed

- `startDate` and `endDate` are compared with `nextReviewDate` as **UTC** days, but the site sends the student's local dates, and a review now counts by the student's local day.
- A review due between 00:00 and 02:00 Cairo time (22:00–24:00 UTC the day before) is left out of the Coming tab's "from today" call. It isn't Missed either, until its day ends. So on its own due day it shows in **neither** /subjects tab. Saudi Arabia: 00:00–03:00.
- **Fixed in the backend:** `date`, `startDate` and `endDate` are now read as days in the student's country (Cairo for Egypt), the same rule `/end` uses. `startDate=2026-11-11` now starts at 22:00 UTC on 10 Nov for an Egyptian student, so the review above shows in the Coming tab. No site change is needed for this one.

### Bad cases

| Send | Get | Show |
| --- | --- | --- |
| No token | 401 `unauthorized` | يرجى تسجيل الدخول مرة أخرى |
| None of `date`, `startDate`, `endDate` | 400, "Provide a date, or a start date and/or end date." | القيمة المدخلة غير صحيحة |
| `endDate` before `startDate` | 400, "EndDate must be on or after StartDate." | القيمة المدخلة غير صحيحة |

### Notes

- **Completed plans:** `nextReviewDate` is now the day the schedule was finished (status 8, `reviewInterval: 0`). Show it as "اكتمل في {date}". Plans finished before this change still carry the old date.
- **When a review turns Missed:** only after its due day ends in the student's country, not at the exact due time. A review due today stays in the Coming tab all day.
- The Missed marking runs hourly and when the server starts. A review can show as Coming for up to an hour after its day ends, or until the next request if the server was asleep.

## 
