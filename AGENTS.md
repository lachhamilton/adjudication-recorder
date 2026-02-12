# AGENTS.md

Guidance for coding agents working in this repository.

## Project Scope

- This is a **static proof-of-concept** for the Australian School Band and Orchestra Festival (ASBOF) adjudicator recorder.
- Current stack: plain `HTML`, `CSS`, and `JavaScript` only.
- Prioritize clarity and speed of use for non-technical users in live festival conditions.

## Primary UX Goals

- Keep interaction flow simple:
  1. Session setup
  2. Select current band
  3. Record
  4. Submit
  5. Start next recording
- Use stage-based visibility so users only see controls needed for the current step.
- Use large controls, high contrast, and clear state labels.
- Avoid long dropdowns for bands; prefer schedule filters plus search.

## Current Demo Behavior (Do Not Break)

- Audio input selection via `enumerateDevices`.
- Live mic level meter (visual + dB readout).
- Recording controls: Start/Restart, Pause, Resume, Stop.
- Restart must prompt for overwrite confirmation before deleting previous take audio and markers.
- Piece marker support: users can mark each new piece with a timestamp during recording.
- Playback before submit.
- Demo storage flow:
  - On stop, recording is saved in browser storage (IndexedDB).
  - On submit, upload is simulated and local draft is deleted.
- Submission confirmation includes key metadata and demo storage action.

## Browser/API Assumptions

- Must run in modern browsers with `getUserMedia`, `MediaRecorder`, and `IndexedDB`.
- Handle unsupported features gracefully with user-facing fallback messages.
- Never hard-fail the entire UI if one capability is unavailable.

## Code Style

- Keep dependencies at zero unless explicitly requested.
- Prefer small, readable functions in `app.js`.
- Keep CSS tokens/variables in `:root`; preserve existing visual language.
- If adding UI, ensure both desktop and mobile layouts remain usable.

## Integration Direction (Future)

When moving beyond POC:

- Replace mock schedule with authenticated backend schedule data.
- Replace simulated submit with real server upload (audio + metadata).
- Maintain idempotent behavior and clear retry states for submission failures.

## Local Run

- `python3 -m http.server 8080`
- Open `http://localhost:8080`
