# ASBOF Adjudicator Recorder (POC)

Static proof-of-concept for a browser-based adjudication recorder.

## Run Locally

1. From this folder, start a static server:
   - `python3 -m http.server 8080`
2. Open `http://localhost:8080` in a modern browser.
3. Click **Enable Microphone** and allow microphone access.

## What This POC Demonstrates

- Schedule-first band selection (Date + Venue + Stage + Search), avoiding massive all-school dropdowns.
- Context-aware screen flow:
  - Band/session selection view
  - Focused full-screen recording view once a band is selected
  - Submission confirmation view
- Audio input device selection for USB interfaces/microphones.
- Toggleable microphone test panel (dB + smoothed visual meter) for gain setup.
- Live input meter in the recording section while recording is active.
- Recording lifecycle controls:
  - Start (first take)
  - Restart (with overwrite confirmation)
  - Pause
  - Resume
  - Stop
- Piece markers:
  - Mark each new piece during recording
  - Markers are timestamped and included in submission metadata
- Playback before submit.
- Browser draft storage for recorded clips (IndexedDB) in demo mode.
- Submit flow with upload progress simulation that deletes local draft audio after success.
- Submission confirmation and immediate reset for next band.
- Metadata capture ready for backend integration:
  - Adjudicator name
  - Band + school + schedule slot
  - Venue/stage
  - Recording duration
  - Optional notes

## Technical Notes

- Built as plain `HTML/CSS/JavaScript` for easy handover.
- Uses `MediaRecorder` + `getUserMedia`.
- Uses mocked schedule data now; can be replaced later with ASBOF API payloads.

## Integration Next Step (Post-POC)

- Replace mocked schedule with authenticated API calls from ASBOF website backend.
- Replace simulated submit with a real upload endpoint (likely multipart with metadata + audio blob).
- Link each recording to school account + specific ensemble entry.
- Persist upload receipts and allow retry for failed uploads.
