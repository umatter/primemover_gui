# PrimeMover GUI

The web interface of [PrimeMover](https://github.com/umatter/primemover-orchestrator), a platform
for running browser-automation experiments with configurable bots. The GUI is where a researcher
creates experiments, defines bots (crawlers) with their browser profile, proxy and behaviour,
schedules runs, and inspects what each run and job did.

It is an Angular 17 single-page application and talks to the
[PrimeMover API](https://github.com/umatter/primemover_api); it has no backend of its own.

| Repository | Role |
|---|---|
| [primemover-orchestrator](https://github.com/umatter/primemover-orchestrator) | setup, monitoring, debugging, experiment design (`pmspec`) — start here |
| [primemover_api](https://github.com/umatter/primemover_api) | experiment management API (Laravel) |
| [primemover_runner](https://github.com/umatter/primemover_runner) | executes the scheduled runs in real browsers (Java) |
| primemover_gui | this repository |

## Run it

The simplest way to get a working GUI together with an API to talk to is the orchestrator's
`orchestrator setup` / `orchestrator up`. To run only the GUI:

```bash
docker build -t primemover-gui .
docker run -p 8080:8080 -e API_ENDPOINT=https://<your-api-host>/api/v1 primemover-gui
```

`API_ENDPOINT` is injected when the container starts, so one image serves any deployment. Leave it
unset when the API is served on the same origin under `/api`; the bundle then falls back to
`/api/v1`.

## Develop

Requires Node 22.

```bash
npm ci
npm start             # dev server on http://localhost:4200
npm run lint          # eslint + stylelint
npm run test.ci       # unit tests, headless Chrome
npm run build.prod    # production bundle in dist/
```

`ng test` runs only the specs listed in `tsconfig.spec.json` and `angular.json`; a new spec has to
be added to both lists or it is not compiled. This and the other conventions of the code base
(state management, date formats, design system) are described in [CLAUDE.md](CLAUDE.md).

## Stack

Angular 17, TypeScript, Tailwind CSS, Angular Material/CDK, NgRx with `@ngrx/data`, ngx-translate
(English and German).

## Funding

Development of PrimeMover was funded by the Swiss National Science Foundation (SNSF),
grants 100018_207698 and CRSK-1_190429.

## License

MIT, see [LICENSE](LICENSE).
