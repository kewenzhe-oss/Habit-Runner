# Habit Runner UI/UX review

Scope: source review of the public landing/about pages, navigation, today dashboard, action creation and recording, history, and settings. This is an initial code-based review, not a substitute for a usability study or a rendered accessibility audit.

## Direction

Habit Runner works best as a quiet, practical daily companion: make the next action and its current state easy to understand, respect low-energy days, and let the user's own records provide personality. Favor plain language, familiar controls, and clear status over motivational slogans or decorative effects.

## Findings and priorities

1. **Today should lead to action.** The energy selector, progress, quote and quote controls all appeared before the action list. The daily inspiration is now available on demand; the animated glow and verbose changing greeting have been removed. Check the resulting first viewport on small phones with realistic data.
2. **Use accurate status language.** A recorded routine can be a rest or a lapse, so the divider now says “recorded” rather than “completed”. The compass still counts completed/rest outcomes differently from the list's recorded group; review the meaning of progress and the treatment of lapses with real users before changing domain semantics.
3. **Action creation needs a readability pass.** The full form uses several 10–11px helper labels and presents many settings. Test mobile creation for each action type, raise the most important text sizes, and progressively disclose infrequent settings without hiding essential choices.
4. **History needs legibility testing.** The matrix and history summaries use 10–11px labels and faded text. Check contrast, zoom, screen-reader descriptions, and touch interaction with starter and mature data; increase size and contrast where needed.
5. **Theme consistency needs visual verification.** The dark theme uses a red primary while other status colors use green, blue and purple. Verify focus, action hierarchy and contrast in both themes before choosing a shared semantic palette.
6. **Empty and filtered states need scenario testing.** Low/rest energy hides non-core items, while category filters may also hide results. Confirm users can distinguish an empty account from a filtered list and restore their items easily.
7. **Public and application copy differ in voice and language.** The public about page and navigation contain English while the main landing and default app use Chinese. Review language intent and terminology as a whole before rewriting product claims.

## Evidence and limitations

Impeccable's source detector initially reported two side-border patterns, in the about page and action detail; both have been simplified. The source scan does not measure rendered contrast or touch sizes. Browser, device, accessibility and real-user testing are still needed to validate the observations above.
