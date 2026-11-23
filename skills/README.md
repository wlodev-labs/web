# Agent skills

This directory ships **one** skill, `wlodev-web`.

## Install in a project

```sh
npx skills add wlodev-labs/web --skill wlodev-web
```

To pick an agent explicitly, add for example `-a claude-code`.

## Update

```sh
npx skills update
```

The skill tracks `main` of this repository. When conventions change, change them here, push, and run `npx skills update` in each project.

## Make sure the agent always uses it

Skills load automatically based on their description, but add this line to each project's `CLAUDE.md` / `AGENTS.md` to make it deterministic:

```md
Always load and follow the `wlodev-web` skill before writing or reviewing code in this repository.
```
