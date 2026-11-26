# WHIT3KID-JAILBR3KER

**Developed by WhiteKid TechZW**  
Version: `3.0.0`  
Tagline: **Breaking Limits. Building Intelligence.**

WHIT3KID-JAILBR3KER is a responsive AI developer command center with a Node.js backend and a multi-provider AI integration.

## Features

- Futuristic black and crimson responsive interface.
- AI workspace with chat history for the current browser session.
- Gemini, Groq and OpenRouter provider support.
- Automatic provider fallback (Gemini → Groq → OpenRouter).
- Modes for code generation, debugging, explanation, review, optimization, project planning and documentation.
- Searchable, copyable command directory.
- Code Lab templates for Python, JavaScript, HTML, C#, Unity, Android, API development and architecture.
- Local code editor with copy and download actions.
- Developer workflow shortcuts.
- Security guidance and provider status.
- API keys remain server-side in environment variables.

## Requirements

- Node.js 18.17 or newer.
- At least one provider API key.

## Setup

1. Extract the ZIP.
2. Open a terminal in the extracted `WHIT3KID-JAILBR3KER` folder.
3. Install packages:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Add one or more API keys to `.env`.
6. Start the app:

   ```bash
   npm start
   ```

7. Open `http://localhost:3000`.

## API keys

Create keys through the providers' official consoles:

- Gemini: https://aistudio.google.com/app/apikey
- Groq: https://console.groq.com/keys
- OpenRouter: https://openrouter.ai/keys

Example `.env`:

```env
GEMINI_API_KEY=your_new_gemini_key
GEMINI_MODEL=gemini-flash-latest

GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openrouter/free

PORT=3000
```

You only need one provider key. For automatic fallback, configure multiple keys. Free model availability, quotas, rate limits and model names are controlled by each provider and may change.

**Security:** Never put API keys in `public/`, frontend JavaScript, GitHub, screenshots or public messages. The `.env` file is excluded by `.gitignore`. Since a key was previously shared in a chat, revoke that exposed key and create a replacement before deploying.

## Deploy on Render

1. Push the extracted project to a private or public GitHub repository (do not upload `.env`).
2. Create a new Web Service on Render and connect the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add your provider key(s) under Environment Variables in Render.
6. Deploy and open the service URL.

## API endpoints

- `GET /api/status` — returns app version and whether each provider key is configured (never returns key values).
- `POST /api/chat` — sends a prompt to the selected provider or uses automatic fallback.

Example request:

```json
{
  "message": "Explain JavaScript promises",
  "history": [],
  "mode": "explain",
  "provider": "auto"
}
```

## Notes

- The AI workspace requires a running Node.js backend; opening `index.html` directly as a local file will not connect to the API.
- Chat history is kept in browser memory for the current page session and is not stored in a database.
- The Code Lab editor runs locally in the browser. It does not compile or execute code.
- The AI tools provide prompts to the model; generated code must be reviewed and tested before use.
- Add authentication and stronger deployment controls before exposing a public instance to unrestricted users.

## Credits

**Project:** WHIT3KID-JAILBR3KER  
**Developer:** WhiteKid TechZW  
**Year:** 2026
