# Contributing to AbrEnergy

Thank you for your interest in contributing! We welcome contributions from everyone.

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## How to Contribute

### 1. Reporting Issues

- Check existing issues before creating a new one
- Use a clear, descriptive title
- Include steps to reproduce, expected behaviour, and actual behaviour
- Include screenshots if relevant
- Mention your browser, OS, and relevant versions

### 2. Suggesting Features

- Describe the problem your feature would solve
- Explain how the feature should work
- Consider how it integrates with the existing multilingual architecture

### 3. Pull Requests

1. **Fork** the repository
2. **Create a branch** from `dev`:
   ```
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** following our conventions (see below)
4. **Test your changes**:
   ```bash
   cd abr-energy-frontend && npm run lint && npm run build
   cd ../AbrEnergy && python manage.py check
   ```
5. **Commit** using conventional commits (see below)
6. **Push** and open a Pull Request against `dev`

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:**

| Type | Usage |
|------|-------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, missing semicolons) |
| `refactor` | Code refactoring without feature changes or bug fixes |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |

**Examples:**

```
feat(cms): add multilingual article translation support
fix(api): resolve login response shape mismatch
docs(readme): add deployment guide
refactor(serializers): use get_translation pattern
```

### Branch Naming

```
feat/solar-calculator-animations
fix/article-cover-upload
docs/deployment-guide
refactor/glass-card-component
```

## Development Setup

See the [README](README.md) for full setup instructions.

### Quick Start

```bash
# Backend
cd AbrEnergy
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py seed_data --force
python manage.py runserver

# Frontend (new terminal)
cd abr-energy-frontend
npm install
npm run dev
```

### Code Style

| Language | Standard |
|----------|----------|
| TypeScript | Strict mode (`strict: true`) |
| Python | PEP 8 (Flake8 recommended) |
| Commits | Conventional Commits |
| Branch names | `feat/`, `fix/`, `docs/`, `refactor/` |

## Project Structure

- `apps/` — Django applications (users, core, articles, services, projects, calculator, contacts, gallery, notifications)
- `src/` — Next.js application
- `src/components/home/` — Homepage‑specific components (Hero3D, CursorGlow, StatsSection, etc.)
- `src/components/shared/` — Reusable components (LoadingSkeleton, DataTable, PageHeader)
- `src/i18n/` — Internationalization system
- `locales/` — Translation JSON files

## Questions?

Open a [discussion](https://github.com/mobinnet3000/AbrEnergy/discussions) or create an issue.
