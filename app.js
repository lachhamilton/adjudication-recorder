const state = {
  schedule: [],
  selectedBandId: null,
  submittedBandIds: new Set(),
  mediaRecorder: null,
  audioChunks: [],
  recordedBlob: null,
  recordedUrl: null,
  recordingState: "idle",
  uiMode: "select",
  recordingSeconds: 0,
  markers: [],
  timerId: null,
  uploadTimer: null,
  inputDevices: [],
  selectedInputId: "",
  stream: null,
  audioContext: null,
  analyser: null,
  analyserData: null,
  analyserSource: null,
  meterFrameId: null,
  meterSmoothedDb: -90,
  storageReady: false,
  storageStatusText: "Storage unavailable",
  storageDbPromise: null,
  draftRecordingId: null,
  uiTransitionTimer: null,
};

const STORAGE = {
  dbName: "asbof-adjudicator-recorder",
  storeName: "recordingDrafts",
};

const els = {
  adjudicatorName: document.getElementById("adjudicatorName"),
  panelGrid: document.getElementById("panelGrid"),
  setupPanel: document.getElementById("setupPanel"),
  bandPanel: document.getElementById("bandPanel"),
  recorderPanel: document.getElementById("recorderPanel"),
  festivalDate: document.getElementById("festivalDate"),
  venueSelect: document.getElementById("venueSelect"),
  stageSelect: document.getElementById("stageSelect"),
  bandSearch: document.getElementById("bandSearch"),
  audioInputSelect: document.getElementById("audioInputSelect"),
  audioHint: document.getElementById("audioHint"),
  micTestPanel: document.getElementById("micTestPanel"),
  toggleMicTestButton: document.getElementById("toggleMicTestButton"),
  micLevelValue: document.getElementById("micLevelValue"),
  micLevelFill: document.getElementById("micLevelFill"),
  micLevelHint: document.getElementById("micLevelHint"),
  bandList: document.getElementById("bandList"),
  scheduleCount: document.getElementById("scheduleCount"),
  selectedBandLabel: document.getElementById("selectedBandLabel"),
  recordingBand: document.getElementById("recordingBand"),
  recordingBandMeta: document.getElementById("recordingBandMeta"),
  recordingState: document.getElementById("recordingState"),
  recordingLevelWrap: document.getElementById("recordingLevelWrap"),
  recordingLevelValue: document.getElementById("recordingLevelValue"),
  recordingLevelFill: document.getElementById("recordingLevelFill"),
  recordingLevelHint: document.getElementById("recordingLevelHint"),
  addMarkerBtn: document.getElementById("addMarkerBtn"),
  markerList: document.getElementById("markerList"),
  timer: document.getElementById("timer"),
  notesField: document.getElementById("notesField"),
  systemStatus: document.getElementById("systemStatus"),
  enableMicButton: document.getElementById("enableMicButton"),
  refreshInputsButton: document.getElementById("refreshInputsButton"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resumeBtn: document.getElementById("resumeBtn"),
  stopBtn: document.getElementById("stopBtn"),
  changeBandBtn: document.getElementById("changeBandBtn"),
  submitBtn: document.getElementById("submitBtn"),
  submitStatus: document.getElementById("submitStatus"),
  uploadTrack: document.getElementById("uploadTrack"),
  uploadFill: document.getElementById("uploadFill"),
  playbackWrap: document.getElementById("playbackWrap"),
  audioPlayback: document.getElementById("audioPlayback"),
  confirmationPanel: document.getElementById("confirmationPanel"),
  confirmationDetails: document.getElementById("confirmationDetails"),
  newRecordingBtn: document.getElementById("newRecordingBtn"),
};

function buildMockSchedule() {
  const dates = ["2026-08-08", "2026-08-09", "2026-08-10"];
  const venues = {
    "Hamer Hall": ["Main Stage", "Chamber Stage"],
    "Melbourne Town Hall": ["Grand Hall", "Lower Hall"],
    "Convention Centre": ["Room A", "Room B"],
  };

  const schools = [
    "Kew High School",
    "Northcote Secondary College",
    "Camberwell Grammar",
    "Methodist Ladies' College",
    "Mac.Robertson Girls' High School",
    "Box Hill High School",
    "Scotch College",
    "Melbourne High School",
    "Balwyn High School",
    "Genazzano FCJ College",
    "Ivanhoe Grammar School",
    "Xavier College",
    "Ruyton Girls' School",
    "Mentone Grammar",
    "Wesley College",
    "Presbyterian Ladies' College",
    "St Kevin's College",
    "Lauriston Girls' School",
    "Eltham High School",
    "Penleigh and Essendon Grammar",
    "Caulfield Grammar School",
    "Shelford Girls' Grammar",
    "Firbank Grammar School",
    "Bialik College",
    "Strathcona Girls Grammar",
    "Canterbury Girls Secondary College",
    "Brighton Grammar School",
    "Carey Baptist Grammar",
    "Nossal High School",
    "Marcellin College",
  ];

  const ensembleTypes = [
    "Concert Band",
    "Symphonic Band",
    "String Orchestra",
    "Big Band",
    "Wind Ensemble",
    "Stage Band",
  ];

  const schedule = [];
  let schoolIndex = 0;

  for (const date of dates) {
    for (const [venue, stages] of Object.entries(venues)) {
      for (const stage of stages) {
        for (let slot = 0; slot < 10; slot += 1) {
          const startMinutes = 9 * 60 + slot * 25;
          const hour = String(Math.floor(startMinutes / 60)).padStart(2, "0");
          const minute = String(startMinutes % 60).padStart(2, "0");
          const time = `${hour}:${minute}`;
          const school = schools[schoolIndex % schools.length];
          const ensemble = `${ensembleTypes[(schoolIndex + slot) % ensembleTypes.length]} ${((schoolIndex % 3) + 1)}`;
          const id = `${date}-${venue}-${stage}-${slot}`;

          schedule.push({
            id,
            date,
            venue,
            stage,
            time,
            school,
            ensemble,
          });

          schoolIndex += 1;
        }
      }
    }
  }

  return schedule;
}

function initSelectors() {
  const dates = [...new Set(state.schedule.map((item) => item.date))];
  els.festivalDate.innerHTML = dates
    .map((date) => `<option value="${date}">${formatDate(date)}</option>`)
    .join("");

  updateVenueOptions();
  updateStageOptions();
}

function updateVenueOptions() {
  const selectedDate = els.festivalDate.value;
  const venues = [...new Set(state.schedule.filter((s) => s.date === selectedDate).map((s) => s.venue))];

  const previous = els.venueSelect.value;
  els.venueSelect.innerHTML = venues.map((venue) => `<option value="${venue}">${venue}</option>`).join("");

  if (venues.includes(previous)) {
    els.venueSelect.value = previous;
  }
}

function updateStageOptions() {
  const selectedDate = els.festivalDate.value;
  const selectedVenue = els.venueSelect.value;
  const stages = [...new Set(
    state.schedule
      .filter((s) => s.date === selectedDate && s.venue === selectedVenue)
      .map((s) => s.stage)
  )];

  const options = [`<option value="">All Stages</option>`].concat(
    stages.map((stage) => `<option value="${stage}">${stage}</option>`)
  );

  const previous = els.stageSelect.value;
  els.stageSelect.innerHTML = options.join("");
  if (stages.includes(previous)) {
    els.stageSelect.value = previous;
  }
}

function getFilteredSchedule() {
  const selectedDate = els.festivalDate.value;
  const selectedVenue = els.venueSelect.value;
  const selectedStage = els.stageSelect.value;
  const query = els.bandSearch.value.trim().toLowerCase();

  return state.schedule.filter((entry) => {
    const dateMatch = entry.date === selectedDate;
    const venueMatch = entry.venue === selectedVenue;
    const stageMatch = !selectedStage || entry.stage === selectedStage;
    const queryMatch =
      !query ||
      `${entry.school} ${entry.ensemble}`.toLowerCase().includes(query);
    return dateMatch && venueMatch && stageMatch && queryMatch;
  });
}

function renderScheduleList() {
  const filtered = getFilteredSchedule();
  els.scheduleCount.textContent = `${filtered.length} scheduled ensembles`;

  if (!filtered.length) {
    els.bandList.innerHTML =
      '<div class="empty-state">No bands match this filter. Change stage or search.</div>';
    return;
  }

  els.bandList.innerHTML = filtered
    .map((entry) => {
      const isSelected = state.selectedBandId === entry.id;
      const isSubmitted = state.submittedBandIds.has(entry.id);
      return `
        <button class="band-item ${isSelected ? "selected" : ""}" type="button" data-band-id="${entry.id}">
          <div class="band-item-header">
            <span>${entry.time} • ${escapeHtml(entry.school)}</span>
            <span class="badge">${escapeHtml(entry.stage)}</span>
          </div>
          <div class="band-item-meta">${escapeHtml(entry.ensemble)}</div>
          ${isSubmitted ? '<div class="band-item-meta"><span class="badge badge-submitted">Submitted</span></div>' : ""}
        </button>
      `;
    })
    .join("");
}

function getSelectedBand() {
  return state.schedule.find((entry) => entry.id === state.selectedBandId) || null;
}

function getPanelForMode(mode) {
  if (mode === "recording") {
    return els.recorderPanel;
  }
  if (mode === "submitted") {
    return els.confirmationPanel;
  }
  return els.bandPanel;
}

function setUiMode(mode) {
  state.uiMode = mode;
  const isSelect = mode === "select";
  const isRecording = mode === "recording";
  const isSubmitted = mode === "submitted";

  els.setupPanel.hidden = !isSelect;
  els.bandPanel.hidden = !isSelect;
  els.recorderPanel.hidden = !isRecording;
  els.confirmationPanel.hidden = !isSubmitted;

  els.panelGrid.classList.toggle("mode-select", isSelect);
  els.panelGrid.classList.toggle("mode-recording", isRecording);
  els.panelGrid.classList.toggle("mode-submitted", isSubmitted);

  const targetPanel = getPanelForMode(mode);
  for (const panel of [els.setupPanel, els.bandPanel, els.recorderPanel, els.confirmationPanel]) {
    panel.classList.remove("panel-enter");
  }

  els.panelGrid.classList.add("mode-transition");
  if (state.uiTransitionTimer) {
    window.clearTimeout(state.uiTransitionTimer);
    state.uiTransitionTimer = null;
  }

  window.requestAnimationFrame(() => {
    targetPanel.classList.add("panel-enter");
  });

  state.uiTransitionTimer = window.setTimeout(() => {
    els.panelGrid.classList.remove("mode-transition");
    if (targetPanel) {
      targetPanel.classList.remove("panel-enter");
    }
    state.uiTransitionTimer = null;
  }, 320);
}

function setSelectedBand(bandId) {
  state.selectedBandId = bandId;
  const band = getSelectedBand();

  if (band) {
    const descriptor = `${band.time} • ${band.school} • ${band.ensemble}`;
    els.selectedBandLabel.textContent = descriptor;
    els.recordingBand.textContent = `${band.school} — ${band.ensemble}`;
    els.recordingBandMeta.textContent = `${formatDate(band.date)} • ${band.time} • ${band.venue} / ${band.stage}`;
    if (state.uiMode === "select") {
      setUiMode("recording");
      els.submitStatus.textContent = "Band locked. Record when ready.";
    }
  } else {
    els.selectedBandLabel.textContent = "No band selected";
    els.recordingBand.textContent = "Select a band first";
    els.recordingBandMeta.textContent = "";
    setUiMode("select");
  }

  renderScheduleList();
  syncControlStates();
}

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setMicLevelUI(levelPercent, dbValueText, hintText) {
  els.micLevelFill.style.width = `${Math.max(0, Math.min(100, levelPercent))}%`;
  els.micLevelValue.textContent = dbValueText;
  els.recordingLevelFill.style.width = `${Math.max(0, Math.min(100, levelPercent))}%`;
  els.recordingLevelValue.textContent = dbValueText;
  if (hintText) {
    els.micLevelHint.textContent = hintText;
    els.recordingLevelHint.textContent = hintText;
  }
}

function toggleMicTestPanel() {
  const willShow = els.micTestPanel.hidden;
  els.micTestPanel.hidden = !willShow;
  els.toggleMicTestButton.textContent = willShow ? "Hide Microphone Test" : "Test Microphone";

  if (willShow && !state.stream) {
    setMicLevelUI(0, "-- dB", "Enable microphone, then speak to check level.");
  }
}

function stopMicLevelMeter(resetUI = true) {
  if (state.meterFrameId) {
    window.cancelAnimationFrame(state.meterFrameId);
    state.meterFrameId = null;
  }

  if (state.analyserSource) {
    state.analyserSource.disconnect();
    state.analyserSource = null;
  }

  state.analyser = null;
  state.analyserData = null;
  state.meterSmoothedDb = -90;

  if (resetUI) {
    setMicLevelUI(0, "-- dB", "Enable microphone, then speak to check level.");
  }
}

function startMicLevelMeter(stream) {
  stopMicLevelMeter(false);

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    setMicLevelUI(0, "-- dB", "Level metering is not supported in this browser.");
    return;
  }

  if (!state.audioContext || state.audioContext.state === "closed") {
    state.audioContext = new AudioCtx();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }

  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 2048;
  state.analyser.smoothingTimeConstant = 0.9;
  state.analyserData = new Float32Array(state.analyser.fftSize);
  state.analyserSource = state.audioContext.createMediaStreamSource(stream);
  state.analyserSource.connect(state.analyser);
  state.meterSmoothedDb = -90;

  const updateLevel = () => {
    if (!state.analyser || !state.analyserData) {
      return;
    }

    state.analyser.getFloatTimeDomainData(state.analyserData);

    let sumSquares = 0;
    let peak = 0;
    for (const sample of state.analyserData) {
      const absSample = Math.abs(sample);
      if (absSample > peak) {
        peak = absSample;
      }
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / state.analyserData.length);
    const rawDb = rms > 0 ? 20 * Math.log10(rms) : -90;
    const clampedRawDb = Math.max(-90, Math.min(0, rawDb));
    const attackFactor = 0.28;
    const releaseFactor = 0.09;
    const factor = clampedRawDb > state.meterSmoothedDb ? attackFactor : releaseFactor;
    state.meterSmoothedDb += (clampedRawDb - state.meterSmoothedDb) * factor;

    const normalized = Math.max(0, Math.min(1, (state.meterSmoothedDb + 60) / 60));
    let hint = "Below target. Increase gain or speak closer to mic.";

    if (peak >= 0.98) {
      hint = "Input is clipping. Reduce interface gain.";
    } else if (state.meterSmoothedDb < -24) {
      hint = "Below target. Increase gain or speak closer to mic.";
    } else if (state.meterSmoothedDb <= -12) {
      hint = "In target zone for adjudicator voice.";
    } else {
      hint = "Above target. Lower interface gain slightly.";
    }

    setMicLevelUI(normalized * 100, `${state.meterSmoothedDb.toFixed(1)} dB`, hint);
    state.meterFrameId = window.requestAnimationFrame(updateLevel);
  };

  updateLevel();
}

function openStorageDb() {
  if (!window.indexedDB) {
    return Promise.reject(new Error("IndexedDB not supported"));
  }

  if (state.storageDbPromise) {
    return state.storageDbPromise;
  }

  state.storageDbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(STORAGE.dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE.storeName)) {
        db.createObjectStore(STORAGE.storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open storage DB"));
  });

  return state.storageDbPromise;
}

function runStorageTransaction(mode, handler) {
  return openStorageDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORAGE.storeName, mode);
        const store = tx.objectStore(STORAGE.storeName);
        let result;

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error("Storage transaction failed"));
        tx.onabort = () => reject(tx.error || new Error("Storage transaction aborted"));

        result = handler(store);
      })
  );
}

async function initialiseStorage() {
  try {
    await openStorageDb();
    state.storageReady = true;
    state.storageStatusText = "Draft audio will be saved in this browser until submit.";
  } catch (error) {
    state.storageReady = false;
    state.storageStatusText = "Browser storage unavailable. Demo submit will still run.";
    console.error(error);
  }
}

function buildDraftRecord(blob) {
  const selectedBand = getSelectedBand();
  return {
    id: state.draftRecordingId || `draft-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    blob,
    createdAt: new Date().toISOString(),
    adjudicator: els.adjudicatorName.value.trim() || "",
    notes: els.notesField.value.trim() || "",
    durationSeconds: state.recordingSeconds,
    inputDevice: selectedDeviceLabel(),
    markers: state.markers.map((marker) => ({
      label: marker.label,
      timeSeconds: marker.timeSeconds,
    })),
    band: selectedBand
      ? {
          id: selectedBand.id,
          school: selectedBand.school,
          ensemble: selectedBand.ensemble,
          date: selectedBand.date,
          time: selectedBand.time,
          venue: selectedBand.venue,
          stage: selectedBand.stage,
        }
      : null,
  };
}

async function saveDraftRecording(blob) {
  if (!state.storageReady) {
    return false;
  }

  try {
    const record = buildDraftRecord(blob);
    await runStorageTransaction("readwrite", (store) => {
      store.put(record);
      return true;
    });
    state.draftRecordingId = record.id;
    return true;
  } catch (error) {
    console.error(error);
    state.storageReady = false;
    state.storageStatusText = "Browser storage unavailable. Demo submit will still run.";
    return false;
  }
}

async function deleteDraftRecording() {
  if (!state.storageReady || !state.draftRecordingId) {
    state.draftRecordingId = null;
    return false;
  }

  try {
    const idToDelete = state.draftRecordingId;
    await runStorageTransaction("readwrite", (store) => {
      store.delete(idToDelete);
      return true;
    });
    state.draftRecordingId = null;
    return true;
  } catch (error) {
    console.error(error);
    state.draftRecordingId = null;
    return false;
  }
}

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    els.systemStatus.textContent = "Browser does not support microphone capture";
    els.audioHint.textContent = "Use a current version of Chrome, Edge, or Safari.";
    setMicLevelUI(0, "-- dB", "Level metering unavailable in this browser.");
    return;
  }

  stopStream();

  try {
    const constraints = state.selectedInputId
      ? { audio: { deviceId: { exact: state.selectedInputId } } }
      : { audio: true };

    state.stream = await navigator.mediaDevices.getUserMedia(constraints);
    els.systemStatus.textContent = "Microphone ready";
    els.audioHint.textContent = "Microphone access granted. Choose device if needed.";
    startMicLevelMeter(state.stream);
    await loadAudioInputs();
    syncControlStates();
  } catch (error) {
    els.systemStatus.textContent = "Microphone access denied or unavailable";
    els.audioHint.textContent = "Check browser permissions and USB/audio interface connection.";
    setMicLevelUI(0, "-- dB", "No live signal. Enable microphone to test level.");
    console.error(error);
  }
}

async function loadAudioInputs() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    els.audioInputSelect.innerHTML = "<option value=''>Audio devices unavailable</option>";
    return;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  state.inputDevices = devices.filter((d) => d.kind === "audioinput");

  if (!state.inputDevices.length) {
    els.audioInputSelect.innerHTML = "<option value=''>No audio inputs detected</option>";
    return;
  }

  const hasSelected = state.inputDevices.some((d) => d.deviceId === state.selectedInputId);
  if (!hasSelected) {
    state.selectedInputId = state.inputDevices[0].deviceId;
  }

  els.audioInputSelect.innerHTML = state.inputDevices
    .map((device, index) => {
      const label = device.label || `Input ${index + 1}`;
      const selected = device.deviceId === state.selectedInputId ? "selected" : "";
      return `<option value="${device.deviceId}" ${selected}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function stopStream() {
  stopMicLevelMeter();

  if (!state.stream) {
    return;
  }
  for (const track of state.stream.getTracks()) {
    track.stop();
  }
  state.stream = null;
}

function getBestMimeType() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return options.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
}

async function startRecording() {
  if (!getSelectedBand()) {
    els.submitStatus.textContent = "Select a band before recording.";
    return;
  }

  if (!window.MediaRecorder) {
    els.submitStatus.textContent = "This browser does not support recording.";
    return;
  }

  if (!state.stream) {
    await requestMicrophoneAccess();
  }

  if (!state.stream) {
    return;
  }

  if (state.recordedBlob) {
    const shouldOverwrite = window.confirm(
      "Restart will permanently delete the current take and markers from browser storage and playback. Continue?"
    );
    if (!shouldOverwrite) {
      return;
    }
  }

  await deleteDraftRecording();
  resetRecordedAudio();
  resetMarkers();
  state.audioChunks = [];

  const mimeType = getBestMimeType();
  const recorder = mimeType
    ? new MediaRecorder(state.stream, { mimeType })
    : new MediaRecorder(state.stream);

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      state.audioChunks.push(event.data);
    }
  });

  recorder.addEventListener("stop", async () => {
    if (!state.audioChunks.length) {
      state.recordedBlob = null;
      syncControlStates();
      return;
    }

    const type = state.audioChunks[0].type || "audio/webm";
    state.recordedBlob = new Blob(state.audioChunks, { type });
    state.recordedUrl = URL.createObjectURL(state.recordedBlob);
    els.audioPlayback.src = state.recordedUrl;
    els.playbackWrap.hidden = false;
    const saved = await saveDraftRecording(state.recordedBlob);
    if (saved) {
      els.submitStatus.textContent = "Saved in browser storage. Ready to submit (demo mode).";
    } else {
      els.submitStatus.textContent = "Ready to submit. Browser storage unavailable.";
    }
    syncControlStates();
  });

  state.mediaRecorder = recorder;
  recorder.start(500);
  state.recordingState = "recording";
  state.recordingSeconds = 0;
  addMarker(0, "Piece 1");
  startTimer();
  updateRecordingStateUI();
  syncControlStates();
}

function pauseRecording() {
  if (!state.mediaRecorder || state.recordingState !== "recording") {
    return;
  }

  state.mediaRecorder.pause();
  state.recordingState = "paused";
  stopTimer();
  updateRecordingStateUI();
  syncControlStates();
}

function resumeRecording() {
  if (!state.mediaRecorder || state.recordingState !== "paused") {
    return;
  }

  state.mediaRecorder.resume();
  state.recordingState = "recording";
  startTimer();
  updateRecordingStateUI();
  syncControlStates();
}

function stopRecording() {
  if (!state.mediaRecorder || !["recording", "paused"].includes(state.recordingState)) {
    return;
  }

  state.mediaRecorder.stop();
  state.recordingState = "stopped";
  stopTimer();
  updateRecordingStateUI();
  syncControlStates();
}

function resetRecordedAudio() {
  state.recordedBlob = null;
  state.audioChunks = [];
  if (state.recordedUrl) {
    URL.revokeObjectURL(state.recordedUrl);
    state.recordedUrl = null;
  }

  els.audioPlayback.removeAttribute("src");
  els.playbackWrap.hidden = true;
  els.submitBtn.disabled = true;
}

function hasTakeMaterial() {
  return Boolean(state.recordedBlob) || state.recordingSeconds > 0 || state.markers.length > 0;
}

async function changeBand() {
  const isRecording = state.recordingState === "recording";
  const isPaused = state.recordingState === "paused";
  const isUploading = state.recordingState === "uploading";
  if (isRecording || isPaused || isUploading) {
    return;
  }

  if (hasTakeMaterial()) {
    const shouldDiscard = window.confirm(
      "Changing band will clear the current take and piece markers. Continue?"
    );
    if (!shouldDiscard) {
      return;
    }
  }

  stopTimer();
  await deleteDraftRecording();
  resetRecordedAudio();
  resetMarkers();
  state.recordingState = "idle";
  state.recordingSeconds = 0;
  updateTimer();
  updateRecordingStateUI();
  els.uploadTrack.hidden = true;
  els.uploadFill.style.width = "0%";
  els.submitStatus.textContent = "Select a band for this adjudication.";
  setSelectedBand(null);
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    state.recordingSeconds += 1;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (!state.timerId) {
    return;
  }
  window.clearInterval(state.timerId);
  state.timerId = null;
}

function updateTimer() {
  const mins = Math.floor(state.recordingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (state.recordingSeconds % 60).toString().padStart(2, "0");
  els.timer.textContent = `${mins}:${secs}`;
}

function formatSecondsAsTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function renderMarkers() {
  if (!state.markers.length) {
    els.markerList.innerHTML = '<div class="marker-empty">No markers yet.</div>';
    return;
  }

  els.markerList.innerHTML = state.markers
    .map((marker, index) => {
      return `
        <div class="marker-item">
          <span>${index + 1}. ${escapeHtml(marker.label)}</span>
          <span class="marker-time">${formatSecondsAsTime(marker.timeSeconds)}</span>
        </div>
      `;
    })
    .join("");
}

function resetMarkers() {
  state.markers = [];
  renderMarkers();
}

function addMarker(timeSeconds, labelText) {
  const fallbackLabel = `Piece ${state.markers.length + 1}`;
  const label = labelText && labelText.trim() ? labelText.trim() : fallbackLabel;
  state.markers.push({
    id: `marker-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    timeSeconds,
    label,
  });
  renderMarkers();
}

function markNewPiece() {
  const isRecording = state.recordingState === "recording";
  const isPaused = state.recordingState === "paused";
  if (!isRecording && !isPaused) {
    return;
  }

  const entered = window.prompt(
    "Optional piece name for this marker (leave blank for automatic label):",
    ""
  );

  if (entered === null) {
    return;
  }

  addMarker(state.recordingSeconds, entered);
}

function updateRecordingMeterVisibility() {
  const shouldShow = state.recordingState === "recording";
  els.recordingLevelWrap.hidden = !shouldShow;
}

function updateRecordingStateUI() {
  const mapping = {
    idle: "Idle",
    recording: "Recording",
    paused: "Paused",
    stopped: "Stopped",
    uploading: "Uploading",
    submitted: "Submitted",
  };

  els.recordingState.textContent = mapping[state.recordingState] || "Idle";

  if (state.recordingState === "recording") {
    els.recordingState.style.color = "#2f7c46";
  } else if (state.recordingState === "paused") {
    els.recordingState.style.color = "#946b1a";
  } else if (state.recordingState === "submitted") {
    els.recordingState.style.color = "#2f7c46";
  } else if (state.recordingState === "uploading") {
    els.recordingState.style.color = "#946b1a";
  } else {
    els.recordingState.style.color = "#5a695e";
  }

  updateRecordingMeterVisibility();
}

function syncControlStates() {
  const hasBand = Boolean(getSelectedBand());
  const hasRecording = Boolean(state.recordedBlob);
  const isRecording = state.recordingState === "recording";
  const isPaused = state.recordingState === "paused";
  const isUploading = state.recordingState === "uploading";
  const isSubmitted = state.recordingState === "submitted";
  const canMarkPiece = (isRecording || isPaused) && !isUploading;

  els.startBtn.disabled = !hasBand || isRecording || isPaused || isUploading || isSubmitted;
  els.startBtn.textContent = hasRecording ? "Restart" : "Start";
  els.pauseBtn.disabled = !isRecording || isUploading;
  els.resumeBtn.disabled = !isPaused || isUploading;
  els.stopBtn.disabled = !(isRecording || isPaused) || isUploading;
  els.changeBandBtn.disabled = isRecording || isPaused || isUploading;
  els.addMarkerBtn.disabled = !canMarkPiece;
  els.submitBtn.disabled = !hasRecording || isRecording || isPaused || isUploading || isSubmitted;
}

function selectedDeviceLabel() {
  const selected = state.inputDevices.find((d) => d.deviceId === state.selectedInputId);
  if (selected && selected.label) {
    return selected.label;
  }
  return "Default microphone";
}

function submitRecording() {
  if (!state.recordedBlob || state.recordingState === "uploading") {
    return;
  }

  const selectedBand = getSelectedBand();
  if (!selectedBand) {
    els.submitStatus.textContent = "Select a band before submitting.";
    return;
  }

  state.recordingState = "uploading";
  updateRecordingStateUI();
  syncControlStates();

  els.uploadTrack.hidden = false;
  els.uploadFill.style.width = "0%";
  els.submitStatus.textContent = "Simulating ASBOF submit...";

  let progress = 0;
  if (state.uploadTimer) {
    window.clearInterval(state.uploadTimer);
  }

  state.uploadTimer = window.setInterval(async () => {
    progress = Math.min(progress + 8, 100);
    els.uploadFill.style.width = `${progress}%`;

    if (progress >= 100) {
      window.clearInterval(state.uploadTimer);
      state.uploadTimer = null;

      let storageAction = "No local draft existed to delete.";
      try {
        const removed = await deleteDraftRecording();
        if (removed) {
          storageAction = "Demo submit removed local browser copy.";
        }
      } catch (error) {
        storageAction = "Submit simulated, but local draft deletion failed.";
        console.error(error);
      }

      state.recordingState = "submitted";
      updateRecordingStateUI();
      state.submittedBandIds.add(selectedBand.id);
      els.submitStatus.textContent = "Demo submit complete. Local clip cleared.";
      showConfirmation(selectedBand, storageAction);
      renderScheduleList();
      syncControlStates();
    }
  }, 140);
}

function showConfirmation(selectedBand, storageAction) {
  const receiptId = `ASBOF-${Date.now().toString().slice(-8)}`;
  const markerSummary = state.markers.length
    ? state.markers
        .map((marker) => `${formatSecondsAsTime(marker.timeSeconds)} ${marker.label}`)
        .join(" | ")
    : "No markers";
  const rows = [
    ["Receipt", receiptId],
    ["Band", `${selectedBand.school} — ${selectedBand.ensemble}`],
    ["Venue/Stage", `${selectedBand.venue} / ${selectedBand.stage}`],
    ["Scheduled Time", `${formatDate(selectedBand.date)} ${selectedBand.time}`],
    ["Adjudicator", els.adjudicatorName.value.trim() || "Not entered"],
    ["Audio Input", selectedDeviceLabel()],
    ["Duration", els.timer.textContent],
    ["Piece Markers", String(state.markers.length)],
    ["Marker Detail", markerSummary],
    ["Notes", els.notesField.value.trim() || "None"],
    ["Demo Storage Action", storageAction],
  ];

  els.confirmationDetails.innerHTML = rows
    .map(([label, value]) => {
      return `<div class="confirmation-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
    })
    .join("");

  setUiMode("submitted");
  els.confirmationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function startNewRecordingFlow() {
  state.selectedBandId = null;
  state.recordingState = "idle";
  state.recordingSeconds = 0;

  stopTimer();
  await deleteDraftRecording();
  resetRecordedAudio();
  resetMarkers();

  els.uploadTrack.hidden = true;
  els.uploadFill.style.width = "0%";
  els.submitStatus.textContent = "Select the next band, then record.";
  els.notesField.value = "";
  els.confirmationPanel.hidden = true;

  updateTimer();
  renderMarkers();
  updateRecordingStateUI();
  setSelectedBand(null);
  syncControlStates();
}

function bindEvents() {
  els.festivalDate.addEventListener("change", () => {
    updateVenueOptions();
    updateStageOptions();
    setSelectedBand(null);
    renderScheduleList();
  });

  els.venueSelect.addEventListener("change", () => {
    updateStageOptions();
    setSelectedBand(null);
    renderScheduleList();
  });

  els.stageSelect.addEventListener("change", () => {
    setSelectedBand(null);
    renderScheduleList();
  });

  els.bandSearch.addEventListener("input", () => {
    setSelectedBand(null);
    renderScheduleList();
  });

  els.bandList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-band-id]");
    if (!button) {
      return;
    }
    setSelectedBand(button.dataset.bandId || null);
  });

  els.enableMicButton.addEventListener("click", requestMicrophoneAccess);
  els.refreshInputsButton.addEventListener("click", loadAudioInputs);
  els.toggleMicTestButton.addEventListener("click", toggleMicTestPanel);

  els.audioInputSelect.addEventListener("change", async (event) => {
    state.selectedInputId = event.target.value;
    els.audioHint.textContent = "Audio input selected. Applying device...";
    if (state.stream) {
      await requestMicrophoneAccess();
    }
  });

  els.startBtn.addEventListener("click", startRecording);
  els.pauseBtn.addEventListener("click", pauseRecording);
  els.resumeBtn.addEventListener("click", resumeRecording);
  els.stopBtn.addEventListener("click", stopRecording);
  els.changeBandBtn.addEventListener("click", changeBand);
  els.addMarkerBtn.addEventListener("click", markNewPiece);
  els.submitBtn.addEventListener("click", submitRecording);
  els.newRecordingBtn.addEventListener("click", startNewRecordingFlow);

  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", loadAudioInputs);
  }

  window.addEventListener("beforeunload", () => {
    stopStream();
    stopTimer();
    if (state.uploadTimer) {
      window.clearInterval(state.uploadTimer);
      state.uploadTimer = null;
    }
    if (state.recordedUrl) {
      URL.revokeObjectURL(state.recordedUrl);
    }
    if (state.audioContext && state.audioContext.state !== "closed") {
      state.audioContext.close().catch(() => {});
    }
  });
}

async function init() {
  state.schedule = buildMockSchedule();
  initSelectors();
  renderScheduleList();
  bindEvents();
  await initialiseStorage();
  setUiMode("select");
  updateTimer();
  updateRecordingStateUI();
  syncControlStates();
  setMicLevelUI(0, "-- dB", "Enable microphone, then speak to check level.");
  els.submitStatus.textContent = `Record, stop, then submit. ${state.storageStatusText}`;
  loadAudioInputs();
}

void init();
