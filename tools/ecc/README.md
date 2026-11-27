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

- **Runtime de hooks de ECC** (316 archivos; sus comandos llevan rutas absolutas de la máquina, así que no es portable dentro de un repo). Ver "Hooks opcionales por máquina".
- **Destino `codex` del instalador oficial**: escribe `~/.codex/config.toml` con búsqueda web activa y seis servidores MCP lanzados con `npx -y` (dos sin versión fija). Codex usa `AGENTS.md` en su lugar.
- Skills `security-review` y comandos `/plan` y `/code-review` de ECC: duplican funciones nativas de Claude Code.
- Servidores MCP, `auto-update`, la GitHub App de ECC Tools y el puente de cómputo Itô: código remoto o servicios de pago.

## Hooks opcionales por máquina

No se instalan con este paquete. Afectan a **todas** las sesiones de Claude Code de la máquina, así que no deben activarse mientras haya agentes trabajando en ella.

```bash
# desde el checkout de ECC en el commit fijado
./install.sh --target claude --modules hooks-runtime --enable-hooks --dry-run   # revisar; luego sin --dry-run

# entorno recomendado (perfil más conservador)
export ECC_HOOK_PROFILE=minimal
export ECC_SKIP_LLM_SUMMARY=1   # no envía extractos de la conversación a `claude -p` (evita consumo extra)
export ECC_SKIP_OBSERVE=1       # no guarda entradas/salidas de herramientas en el home
export ECC_GATEGUARD=off        # evita bloqueos que detienen ejecuciones desatendidas
# interruptor general: ECC_HOOKS_ENABLED=false
```

Con `minimal` quedan activos: bloqueo de `--no-verify`, inicio/fin de sesión (resumen para recuperar sesiones), registro de costos y métricas. El perfil `standard` añade hooks que reescriben comandos, formatean código al terminar, lanzan `npx` y arrancan servidores MCP duplicados; no usarlo sin desactivar esos hooks con `ECC_DISABLED_HOOKS`.

El instalador pone `includeCoAuthoredBy: false` en `~/.claude/settings.json` y crea `~/.claude/ecc/state.db`; `uninstall` no revierte ninguna de las dos cosas. No ejecutar `/auto-update`: descarga y reinstala código sin auditar.
