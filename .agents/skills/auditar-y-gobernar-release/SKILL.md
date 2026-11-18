---
name: auditar-y-gobernar-release
description: Auditar el estado real de los repositorios de Pockit Finance (avance, ramas, commits) y gobernar los pases de develop a main (producción) con Changelog y autorización expresa del Usuario.
---

# Auditoría de Repositorio y Gobernanza de Release — Pockit Finance

Esta habilidad está diseñada específicamente para el **Arquitecto de Software y Dueño del Negocio** de **Pockit Finance**.

---

## 1. Módulo de Auditoría y Rendición de Cuentas

Como socio estratégico del Usuario, eres responsable de inspeccionar periódicamente la realidad del código en los repositorios:
- Repositorio de Backend: `C:/Users/ARCHER/Documents/Proyectos/pockit-finance/pockit-finance-backend`
- Repositorio de Frontend: `C:/Users/ARCHER/Documents/Proyectos/pockit-finance/pockit-finance-frontend`
- Repositorio de Documentación: `C:/Users/ARCHER/Documents/Proyectos/pockit-finance/pockit-finance-docs`

### 1.1 Comandos de Inspección y Sincronización
Para responder con evidencia fresca, sin suposiciones y con el estado remoto actualizado:
```bash
# Sincronizar referencias remotas obligatoriamente
git fetch --all --prune

# Ver ramas activas y estado
git branch -a
git status

# Ver historial de integración en develop
git log develop --oneline -n 10

# Comparar develop vs main (diferencias pendientes de release)
git log main..develop --oneline
```

### 1.2 Estructura del Informe de Avance al Usuario
Siempre que el Usuario consulte por el avance o al cerrar una fase, responde con este formato transparente:

```markdown
### 📊 Estado Actual del Proyecto (Evidencia del Repositorio)

1. **✅ Completado (En `develop`, certificado por QA):**
   - [Módulo/Historia de Usuario] — Commit `hash`: [Descripción breve y fecha].
2. **🔄 En Curso (En ramas de trabajo):**
   - [Rama `feature/*` o `qa/*`]: [Desarrollador/QA trabajando en X componente].
3. **⏳ Pendiente (Backlog del hito actual):**
   - [Tareas pendientes del backlog-backend.md para completar el objetivo pactado].
```

---

## 2. Módulo de Gobernanza de Release (Pase a `main`)

La rama `main` representa **producción** y es sagrada.

> [!CAUTION]
> **REGLA INQUEBRANTABLE:**
> **Jamás** ejecutas un merge hacia `main` de forma autónoma.
> **Solo tú, con la autorización expresa y por escrito del Usuario**, puedes integrar a `main`.

### Protocolo Paso a Paso para Release:

#### Paso 1: Verificación de Evidencia Fresca en `develop`
Asegúrate de que la rama `develop` compile, pase todos los tests y esté certificada:
```bash
git checkout develop
git pull
npm test
npm run build
```
*Si hay fallos, se aborta el release y se notifica al Líder Técnico.*

#### Paso 2: Generación del Changelog y Reporte de Release
Analiza los commits que entrarán en producción:
```bash
git log main..develop --pretty=format:"* %s (%h - %an)"
```
Genera un borrador de Release Notes:
```markdown
# 🚀 Propuesta de Release: Versión vX.Y.Z

**Fecha:** YYYY-MM-DD
**Rango de Commits:** `main` ... `develop`

### Resumen de Cambios:
- **Nuevas Funcionalidades (Feat):** ...
- **Correcciones (Fix):** ...
- **Cambios en Esquema / BD (`pockit-ares.sql`):** ...

### Estado de Certificación:
- Tests Unitarios / E2E: PASS (100%)
- Certificación QA: APROBADA
```

#### Paso 3: Visto Bueno del Usuario (Gate Obligatorio)
Presenta la propuesta al Usuario con la pregunta:
> *"He verificado que la suite está en verde y el Changelog está listo. ¿Autorizas ejecutar el pase a producción (`main`) con la etiqueta `vX.Y.Z`?"*

**Detén la ejecución y espera la respuesta del Usuario.** No procedas sin su aprobación clara.

#### Paso 4: Ejecución del Merge a `main` y Etiquetado
Una vez recibida la confirmación:
```bash
git checkout main
git pull
git merge --no-ff develop -m "release: vX.Y.Z"
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --tags
git checkout develop
```

#### Paso 5: Confirmación Final
Informa al Usuario del éxito del release adjuntando el commit hash y la etiqueta generada.
