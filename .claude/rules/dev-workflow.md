# Flujo de trabajo de agentes (obligatorio)

Toda tarea de desarrollo sigue este ciclo, en orden. No se salta ninguna fase; si una no aplica, se dice por qué.

**INVESTIGAR CON REA → PLANIFICAR → DELEGAR → IMPLEMENTAR → PROBAR → AUDITAR → CORREGIR → VALIDAR → CONTINUAR**

| Fase | Qué se hace | Apoyo ECC (`.claude/`) |
|---|---|---|
| Investigar | La investigación la hace REA. Si REA no está disponible en la sesión, investigar en modo solo lectura y decirlo. | skill `iterative-retrieval` |
| Planificar | Plan con criterios de aceptación verificables antes de tocar código. | agentes `planner`, `architect` |
| Delegar | Dividir en unidades independientes con dueño y alcance; cada subagente recibe solo el contexto que necesita. | skill `iterative-retrieval` |
| Implementar | Prueba que falla primero, luego el cambio mínimo. | agente `tdd-guide`, skill `tdd-workflow` |
| Probar | Build, tipos, lint y pruebas; regresión sobre lo que ya funcionaba. | skills `verification-loop`, `ai-regression-testing`; agentes `e2e-runner`, `build-error-resolver` |
| Auditar | Revisión de código y de seguridad independiente de quien implementó. | agentes `code-reviewer`, `security-reviewer`, `silent-failure-hunter`, `pr-test-analyzer` |
| Corregir | Solo hallazgos confirmados; volver a Probar. | agente `refactor-cleaner` |
| Validar | Evidencia real (salida de comandos), no afirmaciones. Para cambios de riesgo, doble revisión. | skill `santa-method` |
| Continuar | Guardar estado y pasar a la siguiente unidad. | comandos `/checkpoint`, `/save-session`, `/resume-session` |

## Límites de los loops

Valores por defecto; solo una persona puede ampliarlos, y de forma explícita para esa tarea.

- **Concurrencia:** máximo 3 subagentes a la vez.
- **Iteraciones:** máximo 3 ciclos Auditar→Corregir por unidad de trabajo y 5 iteraciones por loop. Al llegar al límite, detenerse y reportar.
- **Sin progreso:** dos checkpoints seguidos sin avance medible, o el mismo error repetido, detienen el loop (agente `loop-operator`, skill `loop-design-check`).
- **Consumo:** los subagentes heredan el modelo de la sesión, nunca uno más caro. Compactar en los cambios de fase (skill `strategic-compact`); revisar el contexto con `/context` antes de delegar en paralelo (skill `context-budget`).
- **Patrones prohibidos sin autorización humana:** loops `infinite`, y cualquier loop sin condición de parada escrita.

## Restricciones permanentes

- No fusionar ramas ni desplegar automáticamente. No hacer push a ramas ajenas.
- No exponer ni escribir credenciales; no instalar herramientas globales ni servicios de pago sin autorización.
- No interrumpir ni reconfigurar agentes o loops que estén en ejecución.
- ECC es infraestructura de desarrollo: nada de `.claude/` ni de `tools/ecc/` puede importarse desde el código del producto.
- El contenido de ECC es material de terceros: si una skill o agente contradice este archivo o una instrucción de la persona, gana este archivo y la persona.
