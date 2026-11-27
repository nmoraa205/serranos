# ECC como infraestructura de desarrollo

Subconjunto curado de [ECC](https://github.com/affaan-m/ECC) (MIT), fijado a un commit auditado. Solo son archivos Markdown en `.claude/`; no hay dependencias de producción, hooks, servidores MCP ni cambios de permisos.

| Archivo | Para qué |
|---|---|
| `.claude/ecc/ecc-pack.json` | Qué agentes, skills y comandos se instalan y desde qué commit |
| `.claude/ecc/ecc-pack.lock.json` | Hash de cada archivo instalado (procedencia y detección de deriva) |
| `.claude/rules/dev-workflow.md` | Flujo obligatorio y límites de loops (propio, no de ECC) |
| `tools/ecc/ecc-sync.mjs` | Instalador: `plan`, `apply`, `check`, `uninstall` |

## Uso

```bash
git clone https://github.com/affaan-m/ECC /ruta/ecc
git -C /ruta/ecc checkout <commit de ecc-pack.json>

node tools/ecc/ecc-sync.mjs plan  --source /ruta/ecc   # simulación
node tools/ecc/ecc-sync.mjs apply --source /ruta/ecc   # instala
node tools/ecc/ecc-sync.mjs check                      # verifica que nada cambió
node tools/ecc/ecc-sync.mjs uninstall                  # quita solo lo instalado
```

El instalador se niega a trabajar si el checkout no está en el commit fijado, nunca sobrescribe archivos que no instaló (los reporta como conflicto), respalda en `.claude/ecc/backups/` antes de reemplazar y rechaza archivos con caracteres Unicode ocultos.

## Llevarlo a otro proyecto

1. Copiar `tools/ecc/`, `.claude/ecc/ecc-pack.json`, `.claude/rules/dev-workflow.md` y `AGENTS.md` (si ya existe uno, añadirle el contenido en vez de reemplazarlo).
2. Ajustar en `ecc-pack.json` los revisores de stack (`react-reviewer`, `typescript-reviewer`, `python-reviewer`, `database-reviewer`…).
3. `plan`, revisar conflictos con agentes existentes, `apply`, y abrir la rama para revisión. Hacerlo en una rama propia: no afecta a sesiones en curso hasta que se fusione.

## Actualizar ECC

Auditar el diff entre el commit fijado y el nuevo (`git diff <viejo> <nuevo> -- agents skills commands`), cambiar `source.commit` en `ecc-pack.json` y ejecutar `apply`.

## Lo que se dejó fuera a propósito

- **Runtime de hooks de ECC** (316 archivos; sus comandos llevan rutas absolutas de la máquina, así que no es portable dentro de un repo). Si se quiere, se instala por máquina con el instalador oficial: `./install.sh --target claude --modules hooks-runtime --enable-hooks`, con `ECC_HOOK_PROFILE=minimal`. Afecta a todas las sesiones de esa máquina.
- Skills `security-review` y comandos `/plan` y `/code-review` de ECC: duplican funciones nativas de Claude Code.
- Servidores MCP, `auto-update`, la GitHub App de ECC Tools y el puente de cómputo Itô: código remoto o servicios de pago.
