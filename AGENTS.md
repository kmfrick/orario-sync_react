# AGENTS.md

## Monorepo guardrails

- Keep frontend in repo root and backend in `orario-sync_unibo/`.
- Do not install tools or packages globally (npm/pip/etc.); prefer project-local installs, `brew` for system tools, or virtual environments.
- Preserve both histories when importing repos. Preferred sequence:
  1. `git fetch <other-repo> <branch>:refs/remotes/<name>/<branch>`
  2. `git merge -s ours --no-commit --allow-unrelated-histories <name>/<branch>`
  3. `git read-tree --prefix=orario-sync_unibo/ -u <name>/<branch>`
  4. `git commit`

## Errors seen and prevention

1. UniBo endpoint drift broke backend parsers.
- Error: `get_department_names()` crashed with `AttributeError: 'NoneType' object has no attribute 'find_all'`.
- Cause: old URLs (`/it/didattica/corsi-di-studio...`) now redirect and old selectors are missing.
- Prevention:
  - Use catalog base `https://www.unibo.it/it/studiare/lauree-e-lauree-magistrali-a-ciclo-unico`.
  - Use grouped courses endpoint `.../elenco?schede=<id>`.
  - Keep legacy parser only as fallback.

2. Wrong course URL source caused timetable endpoint failures (404).
- Error: calling `/orario-lezioni/@@available_curricula` on `.../it/studiare/.../corso/...` URLs returns 404.
- Prevention:
  - Build course link from card image URL (strip `/@@leadimage/...`) to recover canonical `https://corsi.unibo.it/...` base.
  - Use that base with existing timetable/curricula logic.

3. Local package installs failed in sandboxed runs.
- yarn issue: install/update commands failed after DNS/network restrictions.
- pip issue: could not resolve/download packages.
- Prevention:
  - For yarn in restricted environments, set `YARN_CACHE_FOLDER=$PWD/.yarn-cache`.
  - For pip in restricted environments, set `PIP_CACHE_DIR=$PWD/.pip-cache`.
  - Use network-enabled execution context when validating installs.

4. Frontend test command failed despite healthy build.
- Error: Jest exited with code 1 because no test files exist.
- Prevention:
  - Use smoke command: `CI=true yarn test --watchAll=false --passWithNoTests`.

## Minimum local validation checklist

- Frontend: `yarn install --frozen-lockfile`, `yarn build`, `CI=true yarn test --watchAll=false --passWithNoTests`.
- Backend:
  - `python3 -m venv .venv` (if missing)
  - `.venv/bin/python -m pip install -r orario-sync_unibo/requirements.txt`
  - `PYTHONPATH=orario-sync_unibo .venv/bin/python -m compileall -q orario-sync_unibo/api`
  - Run a smoke script that calls:
    - `get_department_names()`
    - `get_course_list(1)`
    - `get_curricula(course_url, 1)`
    - `get_classes(...)`, `get_timetable(...)`, `get_ical_file(...)`
