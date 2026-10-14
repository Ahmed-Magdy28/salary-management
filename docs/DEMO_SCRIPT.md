# Demo video script (about 3 minutes)

Record the deployed app. Wake the API first by opening `/api/health`.

| Time | Show | Say |
|------|------|-----|
| 0:00 | Employees page | "HR managed 10,000 salaries in Excel. This replaces it with a web app: find any person, fix a salary, and answer pay questions." |
| 0:20 | Search, then filter Germany + Engineering, sort by salary | "Search, filters and paging run in the database, so 10,000 rows never reach the browser. Filters are in the URL, so a view can be shared." |
| 0:50 | Add employee: submit empty, then a bad email and salary 0, then valid | "The form uses the same Zod schema as the API, so rules cannot drift. Currency follows the country." |
| 1:20 | Edit a salary, deactivate with the confirm dialog, switch Status to Inactive | "Soft delete keeps history and drops the person from insights." |
| 1:45 | Insights, by country | "Median and percentiles come from Postgres `percentile_cont`. Every row stays in its own currency, so nothing is silently mixed." |
| 2:10 | By job title, pick a country; point at Low sample badge | "Department and job title need a country for the same reason. Small groups are flagged." |
| 2:30 | Pay spread: Germany, Software Engineer | "A histogram shows clustering and outliers; the median band is highlighted." |
| 2:50 | Repo: commit history, `docs/`, test counts | "Requirements, user stories, wireframes and design notes are in the repo. 100+ fast unit tests and 25 end-to-end tests. I used Claude for drafts and ran every step: tests, builds and timing against the seeded database." |

Tips: use a 1280-wide window, zoom the browser to 110%, and keep the terminal hidden until the last step.
