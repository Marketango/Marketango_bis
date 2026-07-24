# Skill `watch` — instalación global

Este skill le da a Claude la capacidad de "ver" videos (URL o archivo local):
descarga con `yt-dlp`, extrae frames con `ffmpeg`, obtiene la transcripción
(subtítulos nativos o Whisper API como respaldo) y se lo pasa a Claude.

Fuente original: https://github.com/bradautomates/claude-video (MIT).

## Dónde vive

- **Copia versionada (este repo):** `.claude/skills/watch/` — se carga
  automáticamente en cualquier sesión de Claude Code abierta en este repo.
- **Copia global (todo Claude):** `~/.claude/skills/watch/` — disponible en
  todas las sesiones, sin importar el proyecto.

## Reinstalar la copia global

En un contenedor nuevo (el entorno remoto es efímero), reinstala la copia
global con:

```bash
bash .claude/skills/watch/install-global.sh
```

## Uso

```
/watch <url-o-ruta-del-video> [pregunta]
```

En la primera invocación el propio skill hace un preflight (`scripts/setup.py`)
que instala `ffmpeg`/`yt-dlp` cuando falten y pide (opcional) una API key de
Whisper (Groq o OpenAI) para videos sin subtítulos.
