# Instrucciones para agentes (Codex y otros)

Este repositorio usa un subconjunto curado de [ECC](https://github.com/affaan-m/ECC) como infraestructura de desarrollo. No se duplica por herramienta: Codex y Claude Code leen los mismos archivos.

1. Antes de trabajar, lee y cumple `.claude/rules/dev-workflow.md` (flujo obligatorio, límites de loops y restricciones).
2. Los roles especializados están en `.claude/agents/*.md`. Para actuar en un rol, lee su archivo y sigue su procedimiento.
3. Los procedimientos reutilizables están en `.claude/skills/<nombre>/SKILL.md`. Abre solo el que necesites.
4. No edites a mano los archivos instalados por ECC; se gestionan con `tools/ecc/ecc-sync.mjs` (ver `tools/ecc/README.md`).
