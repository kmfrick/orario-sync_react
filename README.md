## OrarioSync - React GUI

This is a GUI, written using React and Node.js, for OrarioSync.
It is hosted on GitHub Pages at <https://kmfrick.github.io/orario-sync_react>.

Should be pretty intuitive to use if you study at unibo.

Bug reports are welcome!

Questa è un'interfaccia grafica per OrarioSync, scritta con React e Node.js.

Dovrebbe essere piuttosto intuitiva da usare per chi studia all'unibo.

Le segnalazioni di errori sono benvenute!

## Local Full-Stack Deployment

Run frontend + lambda-compatible backend locally:

```bash
yarn local:deploy
```

This command:
- creates `.venv` if missing
- starts a local API at `http://127.0.0.1:8000/api`
- starts React dev server at `http://127.0.0.1:3000`
- points frontend to local backend automatically

Optional env vars:
- `API_HOST` (default: `127.0.0.1`)
- `API_PORT` (default: `8000`)
- `FRONTEND_PORT` (default: `3000`)
- `INSTALL_DEPS` (default: `1`, set to `0` to skip `pip install`)

## GCP Deployment (Backend on e2-micro + Frontend on GitHub Pages)

Infrastructure and provisioning live in `infra/`.

- Backend deploy (Terraform + Ansible): see `infra/README.md`
- Frontend deploy bound to Terraform backend URL:

```bash
yarn frontend:deploy:ghpages:tf-backend
```
