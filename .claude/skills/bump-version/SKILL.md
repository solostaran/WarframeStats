---
name: bump-version
description: Decide and apply the package.json version bump (patch/minor, never major) before committing in this project. Use before every commit, or when asked to bump the version.
---

# Bump the version before a commit

The version (`package.json`) is shown in the footer of the pages. It follows SemVer for what ships, and also traces significant changes to everything else.
- **Shipped:** what the Docker image is built from: `app.js`, `api/`, `bin/`, `database/`, `security/`, `static/`, `views/`, `web/`, the `Dockerfile` and the dependencies.
- **Not shipped:** everything else: `tests/`, `resources/`, config files, `.claude/`, `.github/`, docs.

## 1. The user's word wins
- A version or a level named by the user ("bump to 1.12.0", "make it a minor") is applied as is, and the rest of this procedure is skipped.
- **Major is only ever the user's choice.** If a change looks breaking (an API route removed or changed, data that older versions cannot read), say so and ask; never bump major on your own.

## 2. Measure the changes since the last bump
Stage the commit first, then:

```bash
base=$(git log -1 --format=%H -G'"version":' -- package.json)
total() { awk '{ files++; lines += $1 + $2 } END { print files+0, "files,", lines+0, "lines" }'; }
echo "shipped: $(git diff --cached --numstat "$base" -- app.js api bin database security static views web Dockerfile | total)"
echo "other:   $(git diff --cached --numstat "$base" -- . ':!app.js' ':!api' ':!bin' ':!database' ':!security' ':!static' ':!views' ':!web' ':!Dockerfile' ':!package-lock.json' | total)"
git diff --cached "$base" -- package.json | grep -E '^[-+] ' | grep -v '"version":'	# dependency (or script/config) changes
git diff --cached -- package.json | grep -E '^[-+]  "version":'	# already bumped in this commit ?
```

The measure covers every commit since the last bump: small non-shipped changes add up until they cross the threshold. `package-lock.json` is generated, so it is not counted.

## 3. Decide
| Change since the last bump | Bump |
|---|---|
| New user-visible functionality: a page, an API route, a reward kind, a form, a statistic | **minor**, whatever the size |
| Any shipped change: fix, update, refactoring, performance, security fix | **patch**, whatever the size |
| Dependency change in `package.json`, new tool | **patch**, whatever the size |
| Only non-shipped files, **at least 3 files or 50 lines** | **patch** |
| Only non-shipped files, under that threshold | none |

- `npm version minor` resets the patch number (1.11.3 → 1.12.0).
- If the staged `package.json` already raises the version, do not bump again; only upgrade a patch bump to minor when the commit now contains a new functionality.

## 4. Apply
```bash
npm version <minor|patch> --no-git-tag-version	# package.json + package-lock.json, no tag, no commit
version=$(node -p "require('./package.json').version")
sed -i "s/^sonar.projectVersion=.*/sonar.projectVersion=$version/" sonar-project.properties
git add package.json package-lock.json sonar-project.properties
```
The bump goes in the same commit as the change, never in a separate commit.

## 5. Report
After the commit, give the result in one line, e.g. `1.11.4 (patch: refactoring, 6 shipped files)`, `1.11.5 (patch: tests, 5 files)` or `no bump (docs, 1 file, 4 lines)`. The commit message itself stays one short sentence, without the version.
