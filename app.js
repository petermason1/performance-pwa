// Main Application Controller

class PerformanceApp {
    constructor() {
        this.metronome = new Metronome();
        
        // Initialize state (view will be restored in setupViews)
        this.currentSetList = null;
        this.currentSongIndex = 0;
        this.currentSong = null;
        this.songHasChanges = false;
        this.originalSongState = null;
        this.reorderEnabled = true; // Default to enabled for reordering
        
        this.init();
    }
    
    init() {
        this.setupViews();
        this.setupMetronome();
        this.setupSongs();
        this.setupSetLists();
        this.setupMIDI();
        this.setupModals();
        this.setupInstallPrompt();
        
        // Load and display data
        this.renderSongs();
        this.renderSetLists();
        
        // Setup Helix connection monitoring
        this.setupHelixConnection();
    }
    
    setupHelixConnection() {
        // Check if Helix is connected via MIDI
        setTimeout(() => {
            this.updateHelixStatus();
        }, 1000); // Wait for MIDI to initialize
        
        // Update status when MIDI devices change
        if (midiController && midiController.isSupported) {
            // Check periodically for MIDI device changes
            setInterval(() => {
                this.updateHelixStatus();
            }, 2000);
        }
    }
    
    updateHelixStatus() {
        const statusEl = document.getElementById('helix-status');
        const helpEl = document.getElementById('helix-help');
        
        if (!statusEl) return;
        
        const outputs = midiController.getOutputs();
        const helixDevice = outputs.find(output => 
            output.name.toLowerCase().includes('helix')
        );
        
        // Check if we're on a mobile/tablet device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
        
        if (helixDevice) {
            statusEl.textContent = `MIDI: Connected (${helixDevice.name})`;
            statusEl.style.color = 'var(--success)';
            if (helpEl) helpEl.style.display = 'none';
            
            // Set as active output if not already set
            if (midiController.output !== helixDevice) {
                const index = outputs.indexOf(helixDevice);
                midiController.setOutput(index);
            }
        } else {
            let helpText = 'MIDI: Helix not found';
            if (isTablet || isMobile) {
                if (navigator.userAgent.includes('iPad')) {
                    helpText += ' • Use USB-Camera adapter + USB cable, or enable Bluetooth MIDI';
                } else if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('Fire')) {
                    helpText += ' • Use USB OTG adapter + USB cable, or enable Bluetooth MIDI';
                }
            }
            statusEl.textContent = helpText;
            statusEl.style.color = 'var(--text-secondary)';
            if (helpEl) {
                helpEl.style.display = 'block';
                if (isTablet || isMobile) {
                    helpEl.textContent = 'Check connection guide in MIDI Lights tab for tablet-specific instructions.';
                }
            }
        }
    }
    
    sendHelixPresetChange(presetNumber, channel = 0) {
        // Helix typically uses MIDI channel 1 (channel 0 in 0-indexed)
        // Use Helix-specific output if configured, otherwise fall back to default
        if (midiController) {
            const success = midiController.sendProgramChange(presetNumber, channel, true); // true = use Helix output
            if (success) {
                console.log(`Sent Helix program change: Preset ${presetNumber}`);
                
                // Update UI feedback
                const statusEl = document.getElementById('helix-status');
                if (statusEl) {
                    statusEl.textContent = `MIDI: Sent Preset ${presetNumber}`;
                    statusEl.style.color = 'var(--success)';
                    setTimeout(() => {
                        this.updateHelixStatus();
                    }, 1500);
                }
            } else {
                console.warn('Failed to send Helix program change - check MIDI connection');
            }
        } else {
            console.warn('Helix MIDI not connected. Connect via USB or 5-pin MIDI.');
        }
    }
    
    setupViews() {
        // Restore saved view on page load - do this FIRST before any rendering
        const savedView = localStorage.getItem('lastView') || 'performance';
        this.currentView = savedView;
        
        // Set initial view state - remove ALL active classes
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Activate saved view
        const targetView = document.getElementById(`${savedView}-view`);
        const targetTab = document.querySelector(`.nav-tab[data-view="${savedView}"]`);
        
        if (targetView) {
            targetView.classList.add('active');
        }
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Setup tab click handlers
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }
    
    switchView(viewName) {
        this.currentView = viewName;
        
        // Save current view to localStorage (but not detail views)
        if (viewName !== 'setlist-detail') {
            localStorage.setItem('lastView', viewName);
        }
        
        // Update nav tabs (hide detail view from tabs)
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (viewName === 'setlist-detail') {
                tab.classList.remove('active');
            } else {
                tab.classList.toggle('active', tab.dataset.view === viewName);
            }
        });
        
        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });
    }
    
    setupMetronome() {
        const bpmSlider = document.getElementById('bpm-slider');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const beatIndicator = document.getElementById('beat-indicator');
        const accentBeatSelect = document.getElementById('accent-beat');
        const polyrhythmSelect = document.getElementById('polyrhythm-select');
        const customPolyrhythmGroup = document.getElementById('custom-polyrhythm-group');
        const customPolyrhythmInput = document.getElementById('custom-polyrhythm');
        
        // BPM slider control
        bpmSlider.addEventListener('input', (e) => {
            const bpm = parseInt(e.target.value);
            this.updateBPM(bpm);
            this.markSongChanged();
        });
        
        // Tempo wheel control - initialize after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.setupTempoWheel();
        }, 50);
        
        // Tap tempo
        document.getElementById('tap-tempo-btn').addEventListener('click', () => {
            this.tapTempo();
        });
        
        // Time signature control in performance view
        const timeSignatureSelect = document.getElementById('time-signature-select');
        if (timeSignatureSelect) {
            timeSignatureSelect.addEventListener('change', (e) => {
                const timeSignature = parseInt(e.target.value);
                this.metronome.setTimeSignature(timeSignature);
                this.updateBeatPatternSelector(timeSignature);
                this.updateTimeSignatureDisplay(timeSignature);
                // Update song if one is loaded
                if (this.currentSong) {
                    this.currentSong.timeSignature = timeSignature;
                    this.markSongChanged();
                }
            });
        }
        
        // Update accent beat options when time signature changes in song modal
        const songTimeSignatureSelect = document.getElementById('song-time-signature');
        if (songTimeSignatureSelect) {
            songTimeSignatureSelect.addEventListener('change', (e) => {
                this.updateBeatPatternSelector(parseInt(e.target.value));
            });
        }
        
        // Clear accents button
        document.getElementById('clear-accents-btn').addEventListener('click', () => {
            this.clearAllAccents();
        });
        
        // No accent button
        document.getElementById('no-accent-btn').addEventListener('click', () => {
            this.setNoAccent();
        });
        
        // Save buttons
        document.getElementById('save-song-btn').addEventListener('click', () => {
            this.saveSongChanges();
        });
        
        // Hold to overwrite button
        const overwriteBtn = document.getElementById('overwrite-song-btn');
        let overwriteHoldTimer = null;
        
        overwriteBtn.addEventListener('mousedown', () => {
            overwriteBtn.classList.add('holding');
            overwriteHoldTimer = setTimeout(() => {
                overwriteBtn.classList.remove('holding');
                if (confirm('Overwrite saved song with current settings?')) {
                    this.saveSongChanges(true);
                }
                overwriteHoldTimer = null;
            }, 1000); // Hold for 1 second
        });
        
        overwriteBtn.addEventListener('mouseup', () => {
            overwriteBtn.classList.remove('holding');
            if (overwriteHoldTimer) {
                clearTimeout(overwriteHoldTimer);
                overwriteHoldTimer = null;
            }
        });
        
        overwriteBtn.addEventListener('mouseleave', () => {
            overwriteBtn.classList.remove('holding');
            if (overwriteHoldTimer) {
                clearTimeout(overwriteHoldTimer);
                overwriteHoldTimer = null;
            }
        });
        
        // Touch support for hold
        overwriteBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            overwriteBtn.classList.add('holding');
            overwriteHoldTimer = setTimeout(() => {
                overwriteBtn.classList.remove('holding');
                if (confirm('Overwrite saved song with current settings?')) {
                    this.saveSongChanges(true);
                }
                overwriteHoldTimer = null;
            }, 1000);
        });
        
        overwriteBtn.addEventListener('touchend', () => {
            overwriteBtn.classList.remove('holding');
            if (overwriteHoldTimer) {
                clearTimeout(overwriteHoldTimer);
                overwriteHoldTimer = null;
            }
        });
        
        // Initialize beat pattern selector
        this.updateBeatPatternSelector(4);
        
        // Polyrhythm control
        polyrhythmSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            
            if (value === '') {
                // Standard metronome
                this.metronome.setPolyrhythm(null);
                customPolyrhythmGroup.style.display = 'none';
            } else if (value === 'custom') {
                // Show custom pattern input
                customPolyrhythmGroup.style.display = 'block';
                // Use existing custom pattern if available
                if (customPolyrhythmInput.value) {
                    this.applyCustomPolyrhythm(customPolyrhythmInput.value);
                }
            } else {
                // Predefined polyrhythm patterns
                customPolyrhythmGroup.style.display = 'none';
                const pattern = this.getPolyrhythmPattern(value);
                this.metronome.setPolyrhythm(pattern, value);
            }
        });
        
        // Custom polyrhythm input
        customPolyrhythmInput.addEventListener('input', (e) => {
            if (polyrhythmSelect.value === 'custom') {
                this.applyCustomPolyrhythm(e.target.value);
                this.markSongChanged();
            }
        });
        
        // Polyrhythm changes
        polyrhythmSelect.addEventListener('change', (e) => {
            this.markSongChanged();
        });
        
        // Play/Pause control
        playPauseBtn.addEventListener('click', () => {
            if (this.metronome.isPlaying) {
                this.metronome.stop();
                playPauseBtn.classList.remove('playing');
                document.getElementById('play-icon').style.display = 'inline';
                document.getElementById('pause-icon').style.display = 'none';
                document.getElementById('btn-text').textContent = 'Start';
                beatIndicator.classList.remove('active');
            } else {
                this.metronome.play();
                playPauseBtn.classList.add('playing');
                document.getElementById('play-icon').style.display = 'none';
                document.getElementById('pause-icon').style.display = 'inline';
                document.getElementById('btn-text').textContent = 'Stop';
            }
        });
        
        // Visual beat callback - now receives accent info
        this.metronome.setOnBeatCallback((beatCount, isAccent) => {
            beatIndicator.classList.add('active');
            if (isAccent) {
                beatIndicator.classList.add('accent');
            } else {
                beatIndicator.classList.remove('accent');
            }
            setTimeout(() => {
                beatIndicator.classList.remove('active');
                beatIndicator.classList.remove('accent');
            }, 100);
        });
        
        this.metronome.setOnTimeUpdateCallback((elapsedTime) => {
            this.updateLyricsDisplay();
        });
        
        // Navigation buttons
        document.getElementById('prev-song-btn').addEventListener('click', () => {
            this.previousSong();
        });
        
        document.getElementById('next-song-btn').addEventListener('click', () => {
            this.nextSong();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentView === 'performance') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    playPauseBtn.click();
                } else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.previousSong();
                } else if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.nextSong();
                }
            }
        });
    }
    
    setupSongs() {
        document.getElementById('new-song-btn').addEventListener('click', () => {
            this.openSongModal();
        });
        
        document.getElementById('import-songs-btn').addEventListener('click', () => {
            this.openImportModal();
        });
        
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.openExportModal();
        });
        
        document.getElementById('import-data-btn').addEventListener('click', () => {
            this.openExportModal();
        });
        
        document.getElementById('load-setlist-btn').addEventListener('click', () => {
            const setListId = document.getElementById('setlist-select').value;
            if (setListId) {
                this.loadSetList(setListId);
            }
        });
        
        // Song sort selector
        const songSortSelect = document.getElementById('song-sort-select');
        if (songSortSelect) {
            // Restore saved sort preference
            const savedSort = localStorage.getItem('songSortBy') || 'artist';
            songSortSelect.value = savedSort;
            
            songSortSelect.addEventListener('change', (e) => {
                const sortBy = e.target.value;
                localStorage.setItem('songSortBy', sortBy);
                this.renderSongs();
            });
        }
    }
    
    setupSetLists() {
        document.getElementById('new-setlist-btn').addEventListener('click', () => {
            this.openSetListModal();
        });
    }
    
    setupMIDI() {
        // Initialize MIDI on app start
        midiController.initialize().then(() => {
            this.updateMIDIOutputs();
        });
        
        document.getElementById('refresh-midi-btn').addEventListener('click', () => {
            midiController.initialize().then(() => {
                this.updateMIDIOutputs();
            });
        });
        
        // Default MIDI output
        document.getElementById('midi-output-select').addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index)) {
                midiController.setOutput(index);
            }
        });
        
        // Helix-specific output
        document.getElementById('helix-output-select').addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index)) {
                midiController.setHelixOutput(index);
                console.log('Helix output set to:', midiController.outputs[index].name);
            } else {
                midiController.helixOutput = null; // Reset to auto-detect
            }
        });
        
        // Lights-specific output
        document.getElementById('lights-output-select').addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index)) {
                midiController.setLightsOutput(index);
                console.log('Lights output set to:', midiController.outputs[index].name);
            } else {
                midiController.lightsOutput = null; // Reset to auto-detect
            }
        });
        
        document.getElementById('test-lights-btn').addEventListener('click', () => {
            this.testMIDILights();
        });
        
        this.generateMIDINoteGrid();
    }
    
    updateMIDIOutputs() {
        const outputs = midiController.getOutputs();
        
        // Update default output select
        const defaultSelect = document.getElementById('midi-output-select');
        defaultSelect.innerHTML = '<option value="">No device selected</option>';
        
        // Update Helix output select
        const helixSelect = document.getElementById('helix-output-select');
        helixSelect.innerHTML = '<option value="">Auto-detect or use default</option>';
        
        // Update Lights output select
        const lightsSelect = document.getElementById('lights-output-select');
        lightsSelect.innerHTML = '<option value="">Auto-detect or use default</option>';
        
        outputs.forEach((output, index) => {
            const name = output.name;
            
            // Add to all selects
            [defaultSelect, helixSelect, lightsSelect].forEach(select => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = name;
                select.appendChild(option);
            });
            
            // Auto-select Helix if detected
            if (name.toLowerCase().includes('helix') && helixSelect.value === '') {
                helixSelect.value = index;
                midiController.setHelixOutput(index);
            }
        });
    }
    
    generateMIDINoteGrid() {
        const grid = document.getElementById('note-grid');
        grid.innerHTML = '';
        
        // Common MIDI notes for lighting (C3 to C5 range: 48-84)
        for (let note = 48; note <= 84; note++) {
            const button = document.createElement('button');
            button.className = 'midi-note-btn';
            button.textContent = this.getNoteName(note);
            button.dataset.note = note;
            button.addEventListener('click', () => {
                midiController.sendNoteOnToLights(note, 127);
                setTimeout(() => {
                    midiController.sendNoteOffToLights(note);
                }, 200);
            });
            grid.appendChild(button);
        }
    }
    
    getNoteName(noteNumber) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(noteNumber / 12) - 1;
        const note = notes[noteNumber % 12];
        return `${note}${octave}`;
    }
    
    testMIDILights() {
        // Test sequence: play notes 48, 52, 55, 60 (C major chord) - sends to lights output
        const testNotes = [48, 52, 55, 60];
        testNotes.forEach((note, index) => {
            setTimeout(() => {
                midiController.sendNoteOnToLights(note, 127);
                setTimeout(() => {
                    midiController.sendNoteOffToLights(note);
                }, 500);
            }, index * 300);
        });
    }
    
    setupModals() {
        // Song modal
        const songModal = document.getElementById('song-modal');
        const songForm = document.getElementById('song-form');
        const songModalClose = songModal.querySelector('.close');
        
        songModalClose.addEventListener('click', () => {
            songModal.style.display = 'none';
        });
        
        songForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSong();
        });
        
        document.querySelector('#song-modal .cancel-btn').addEventListener('click', () => {
            songModal.style.display = 'none';
        });
        
        // Set list modal
        const setListModal = document.getElementById('setlist-modal');
        const setListForm = document.getElementById('setlist-form');
        const setListModalClose = setListModal.querySelector('.close');
        
        setListModalClose.addEventListener('click', () => {
            setListModal.style.display = 'none';
        });
        
        setListForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSetList();
        });
        
        // Fix cancel button - use event delegation to handle dynamically added buttons
        setListModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-btn') || e.target.closest('.cancel-btn')) {
                setListModal.style.display = 'none';
            }
        });
        
        // Import modal
        const importModal = document.getElementById('import-modal');
        const importForm = document.getElementById('import-form');
        const importModalClose = importModal.querySelector('.close');
        
        importModalClose.addEventListener('click', () => {
            importModal.style.display = 'none';
        });
        
        importForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.importSongs();
        });
        
        document.querySelector('#import-modal .cancel-btn').addEventListener('click', () => {
            importModal.style.display = 'none';
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === songModal) {
                songModal.style.display = 'none';
            }
            if (e.target === setListModal) {
                setListModal.style.display = 'none';
            }
            if (e.target === importModal) {
                importModal.style.display = 'none';
            }
            const dataModal = document.getElementById('data-export-modal');
            if (e.target === dataModal) {
                dataModal.style.display = 'none';
            }
        });
        
        // Export/Import Data Modal
        const dataModal = document.getElementById('data-export-modal');
        const dataModalClose = dataModal.querySelector('.close');
        
        dataModalClose.addEventListener('click', () => {
            dataModal.style.display = 'none';
        });
        
        document.querySelectorAll('#data-export-modal .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                dataModal.style.display = 'none';
            });
        });
        
        document.getElementById('copy-export-btn').addEventListener('click', async () => {
            const textarea = document.getElementById('export-data-textarea');
            const data = textarea.value;
            
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(data);
                    alert('✅ Data copied to clipboard!');
                } else {
                    // Fallback for older browsers
                    textarea.select();
                    document.execCommand('copy');
                    alert('✅ Data copied to clipboard!');
                }
            } catch (e) {
                // Fallback if clipboard API fails
                textarea.select();
                document.execCommand('copy');
                alert('✅ Data copied to clipboard!');
            }
        });
        
        document.getElementById('download-export-btn').addEventListener('click', () => {
            const data = this.exportAllData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-pwa-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        document.getElementById('import-data-replace-btn').addEventListener('click', () => {
            this.importAllData(true);
        });
        
        document.getElementById('import-data-merge-btn').addEventListener('click', () => {
            this.importAllData(false);
        });
    }
    
    openSongModal(song = null) {
        const modal = document.getElementById('song-modal');
        const form = document.getElementById('song-form');
        
        if (song) {
            document.getElementById('song-modal-title').textContent = 'Edit Song';
            document.getElementById('song-id').value = song.id;
            document.getElementById('song-name').value = song.name || '';
            // Note: We don't store artist separately in form, it's part of name
            document.getElementById('song-bpm').value = song.bpm || 120;
            document.getElementById('song-time-signature').value = song.timeSignature || 4;
            document.getElementById('song-helix-preset').value = song.helixPreset || '';
            document.getElementById('song-helix-preset-number').value = song.helixPresetNumber !== undefined ? song.helixPresetNumber : '';
            document.getElementById('song-duration').value = song.duration || '';
            document.getElementById('song-lyrics').value = formatLyrics(song.lyrics) || '';
            document.getElementById('song-midi-notes').value = song.midiNotes ? song.midiNotes.join(',') : '';
            
            // Update beat pattern selector if song has accent pattern
            if (song.accentPattern && Array.isArray(song.accentPattern)) {
                setTimeout(() => {
                    this.updateBeatPatternSelector(song.timeSignature || 4);
                    // Apply the pattern
                    song.accentPattern.forEach((accented, index) => {
                        const btn = document.querySelector(`#beat-pattern-selector .beat-btn[data-beat-index="${index}"]`);
                        if (btn) {
                            btn.classList.toggle('accented', accented);
                        }
                    });
                    this.metronome.setAccentPattern(song.accentPattern);
                }, 10);
            }
            
            // Set polyrhythm if song has one
            if (song.polyrhythm) {
                document.getElementById('polyrhythm-select').value = song.polyrhythm.name || 'custom';
                if (song.polyrhythm.name === 'custom') {
                    document.getElementById('custom-polyrhythm-group').style.display = 'block';
                    document.getElementById('custom-polyrhythm').value = song.polyrhythm.pattern.join(',');
                } else {
                    document.getElementById('custom-polyrhythm-group').style.display = 'none';
                }
            } else {
                document.getElementById('polyrhythm-select').value = '';
                document.getElementById('custom-polyrhythm-group').style.display = 'none';
            }
        } else {
            document.getElementById('song-modal-title').textContent = 'New Song';
            form.reset();
            document.getElementById('song-id').value = '';
            
            // Initialize beat pattern selector with NO accents for new songs
            const timeSig = parseInt(document.getElementById('song-time-signature').value) || 4;
            this.updateBeatPatternSelector(timeSig);
            // Make sure metronome also has no accents
            const noAccentPattern = new Array(timeSig).fill(false);
            this.metronome.setAccentPattern(noAccentPattern);
        }
        
        modal.style.display = 'block';
    }
    
    saveSong() {
        const id = document.getElementById('song-id').value;
        const name = document.getElementById('song-name').value;
        const bpm = parseInt(document.getElementById('song-bpm').value);
        const timeSignature = parseInt(document.getElementById('song-time-signature').value);
        const helixPreset = document.getElementById('song-helix-preset').value;
        const helixPresetNumberInput = document.getElementById('song-helix-preset-number').value;
        const helixPresetNumber = helixPresetNumberInput !== '' ? parseInt(helixPresetNumberInput) : null;
        const lyricsText = document.getElementById('song-lyrics').value;
        const midiNotesText = document.getElementById('song-midi-notes').value;
        const durationInput = document.getElementById('song-duration').value;
        const duration = durationInput ? parseFloat(durationInput) : null;
        
        const lyrics = parseLyrics(lyricsText);
        const midiNotes = midiNotesText.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        
        // Get accent pattern from beat selector
        const accentPattern = [];
        document.querySelectorAll('#beat-pattern-selector .beat-btn').forEach(btn => {
            accentPattern.push(btn.classList.contains('accented'));
        });
        
        // Check if any beats are accented - if all false, save as null (default no accent)
        const hasAnyAccent = accentPattern.some(accented => accented);
        
        // Get polyrhythm if set
        let polyrhythm = null;
        const polyrhythmValue = document.getElementById('polyrhythm-select').value;
        if (polyrhythmValue === 'custom') {
            const customPattern = document.getElementById('custom-polyrhythm').value;
            if (customPattern) {
                const pattern = customPattern.split(',').map(p => parseInt(p.trim())).filter(p => p === 0 || p === 1);
                if (pattern.length > 0) {
                    polyrhythm = { pattern, name: 'custom' };
                }
            }
        } else if (polyrhythmValue) {
            const pattern = this.getPolyrhythmPattern(polyrhythmValue);
            if (pattern) {
                polyrhythm = { pattern, name: polyrhythmValue };
            }
        }
        
        const songData = {
            name,
            bpm,
            timeSignature,
            helixPreset,
            helixPresetNumber,
            lyrics,
            midiNotes,
            accentPattern: hasAnyAccent ? accentPattern : null, // Save as null if no accents (default)
            polyrhythm,
            duration: duration || (lyrics.length > 0 ? lyrics[lyrics.length - 1].time / 60 : null)
        };
        
        if (id) {
            dataStore.updateSong(id, songData);
        } else {
            dataStore.addSong(songData);
        }
        
        document.getElementById('song-modal').style.display = 'none';
        this.renderSongs();
    }
    
    openSetListModal(setList = null) {
        const modal = document.getElementById('setlist-modal');
        const form = document.getElementById('setlist-form');
        const songsList = document.getElementById('available-songs-list');
        
        // Populate available songs - ALWAYS sort alphabetically
        let songs = dataStore.getAllSongs();
        
        // Sort alphabetically by song name (and artist if available)
        songs = songs.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            const artistA = (a.artist || '').toLowerCase();
            const artistB = (b.artist || '').toLowerCase();
            
            // Sort by artist first, then song name
            if (artistA !== artistB) {
                return artistA.localeCompare(artistB);
            }
            return nameA.localeCompare(nameB);
        });
        
        songsList.innerHTML = '';
        
        // Get selected song IDs if editing
        const selectedIds = setList ? setList.songIds || [] : [];
        
        // For editing, show selected songs at top (in their saved order), then unselected alphabetically
        const selectedSongs = [];
        const unselectedSongs = [];
        
        songs.forEach(song => {
            if (selectedIds.includes(song.id)) {
                selectedSongs.push(song);
            } else {
                unselectedSongs.push(song);
            }
        });
        
        // Reorder selected songs to match the saved order
        const orderedSelectedSongs = selectedIds
            .map(id => selectedSongs.find(s => s.id === id))
            .filter(s => s);
        
        // Combine: ordered selected songs first, then unselected alphabetically
        const orderedSongs = [...orderedSelectedSongs, ...unselectedSongs];
        
        orderedSongs.forEach((song, index) => {
            const isSelected = selectedIds.includes(song.id);
            const item = document.createElement('div');
            item.className = `sortable-song-item ${isSelected ? 'selected' : ''}`;
            item.draggable = true;
            item.dataset.songId = song.id;
            item.dataset.index = index;
            
            item.innerHTML = `
                <span class="drag-handle">☰</span>
                <span class="song-number-modal">${isSelected ? selectedIds.indexOf(song.id) + 1 : ''}</span>
                <input type="checkbox" id="song-${song.id}" value="${song.id}" ${isSelected ? 'checked' : ''}>
                <label for="song-${song.id}" class="song-checkbox-label">${song.name}${song.artist ? ` <span class="song-artist-small">(${song.artist})</span>` : ''}</label>
            `;
            
            // Drag and drop handlers
            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.outerHTML);
                e.dataTransfer.setData('text/plain', song.id);
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                document.querySelectorAll('.sortable-song-item').forEach(i => i.classList.remove('drag-over'));
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const afterElement = getDragAfterElement(songsList, e.clientY);
                const dragging = document.querySelector('.dragging');
                if (afterElement == null) {
                    songsList.appendChild(dragging);
                } else {
                    songsList.insertBefore(dragging, afterElement);
                }
                updateSongNumbers();
            });
            
            item.addEventListener('dragenter', (e) => {
                e.preventDefault();
                item.classList.add('drag-over');
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
            });
            
            // Toggle selection on click
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                item.classList.toggle('selected', checkbox.checked);
                updateSongNumbers();
                updateSongCount();
            });
            
            songsList.appendChild(item);
        });
        
        // Sort alphabetical button - remove old listeners first
        const sortBtn = document.getElementById('sort-alphabetical-btn');
        if (sortBtn) {
            // Clone and replace to remove old listeners
            const newSortBtn = sortBtn.cloneNode(true);
            sortBtn.parentNode.replaceChild(newSortBtn, sortBtn);
            newSortBtn.addEventListener('click', () => {
                this.sortSongsAlphabeticalInModal();
            });
        }
        
        // Helper function to get element after drag position
        const getDragAfterElement = (container, y) => {
            const draggableElements = [...container.querySelectorAll('.sortable-song-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        };
        
        // Update song numbers based on selection order
        const updateSongNumbers = () => {
            const selectedItems = Array.from(songsList.querySelectorAll('.sortable-song-item.selected'));
            selectedItems.forEach((item, index) => {
                const numberSpan = item.querySelector('.song-number-modal');
                numberSpan.textContent = index + 1;
            });
            document.querySelectorAll('.sortable-song-item:not(.selected) .song-number-modal').forEach(span => {
                span.textContent = '';
            });
        };
        
        // Update song count
        const updateSongCount = () => {
            const count = songsList.querySelectorAll('.sortable-song-item.selected').length;
            document.getElementById('song-count-display').textContent = `${count} song${count !== 1 ? 's' : ''}`;
        };
        
        // Store update functions
        this.updateSongNumbers = updateSongNumbers;
        this.updateSongCount = updateSongCount;
        
        updateSongNumbers();
        updateSongCount();
        
        if (setList) {
            document.getElementById('setlist-modal-title').textContent = 'Edit Set List';
            document.getElementById('setlist-id').value = setList.id;
            document.getElementById('setlist-name').value = setList.name || '';
        } else {
            document.getElementById('setlist-modal-title').textContent = 'New Set List';
            form.reset();
            document.getElementById('setlist-id').value = '';
        }
        
        modal.style.display = 'block';
    }
    
    sortSongsAlphabeticalInModal() {
        const songsList = document.getElementById('available-songs-list');
        const items = Array.from(songsList.querySelectorAll('.sortable-song-item'));
        
        // Separate selected and unselected
        const selectedItems = items.filter(item => item.classList.contains('selected'));
        const unselectedItems = items.filter(item => !item.classList.contains('selected'));
        
        // Sort unselected alphabetically
        unselectedItems.sort((a, b) => {
            const labelA = a.querySelector('.song-checkbox-label').textContent.toLowerCase();
            const labelB = b.querySelector('.song-checkbox-label').textContent.toLowerCase();
            return labelA.localeCompare(labelB);
        });
        
        // Sort selected items by their number order (maintain set list order)
        selectedItems.sort((a, b) => {
            const numA = parseInt(a.querySelector('.song-number-modal').textContent) || 999;
            const numB = parseInt(b.querySelector('.song-number-modal').textContent) || 999;
            return numA - numB;
        });
        
        // Clear and re-append: selected first (in order), then unselected (alphabetical)
        songsList.innerHTML = '';
        selectedItems.forEach(item => songsList.appendChild(item));
        unselectedItems.forEach(item => songsList.appendChild(item));
        this.updateSongNumbers();
    }
    
    saveSetList() {
        const id = document.getElementById('setlist-id').value;
        const name = document.getElementById('setlist-name').value;
        const songsList = document.getElementById('available-songs-list');
        
        // Get song IDs in the order they appear (drag and drop order)
        const selectedItems = Array.from(songsList.querySelectorAll('.sortable-song-item.selected'));
        const songIds = selectedItems.map(item => item.dataset.songId);
        
        const setListData = {
            name,
            songIds
        };
        
        if (id) {
            dataStore.updateSetList(id, setListData);
        } else {
            dataStore.addSetList(setListData);
        }
        
        document.getElementById('setlist-modal').style.display = 'none';
        this.renderSetLists();
    }
    
    renderSongs() {
        const container = document.getElementById('songs-container');
        if (!container) {
            console.warn('songs-container not found');
            return;
        }
        
        let songs = dataStore.getAllSongs();
        
        // Get sort preference
        const sortBy = localStorage.getItem('songSortBy') || 'artist';
        const sortSelect = document.getElementById('song-sort-select');
        if (sortSelect) {
            sortSelect.value = sortBy;
        }
        
        // Sort songs based on preference
        songs = songs.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase().trim();
            const nameB = (b.name || '').toLowerCase().trim();
            const artistA = (a.artist || '').toLowerCase().trim();
            const artistB = (b.artist || '').toLowerCase().trim();
            
            if (sortBy === 'title') {
                // Sort by song name first, then artist
                const nameCompare = nameA.localeCompare(nameB);
                if (nameCompare !== 0) {
                    return nameCompare;
                }
                return artistA.localeCompare(artistB);
            } else {
                // Sort by artist first, then song name
                if (artistA !== artistB) {
                    return artistA.localeCompare(artistB);
                }
                return nameA.localeCompare(nameB);
            }
        });
        
        container.innerHTML = '';
        
        if (songs.length === 0) {
            container.innerHTML = '<p class="empty-state">No songs yet. Create your first song!</p>';
            return;
        }
        
        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3>${song.name}${song.artist ? ` <span class="song-artist">(${song.artist})</span>` : ''}</h3>
                    <div class="card-actions">
                        <button class="btn-icon edit-song" data-id="${song.id}">✏️</button>
                        <button class="btn-icon delete-song" data-id="${song.id}">🗑️</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>BPM:</strong> ${song.bpm}</p>
                    <p><strong>Helix Preset:</strong> ${song.helixPreset || 'None'}</p>
                    <p><strong>Lyrics:</strong> ${song.lyrics ? song.lyrics.length + ' lines' : 'None'}</p>
                </div>
            `;
            
            card.querySelector('.edit-song').addEventListener('click', () => {
                this.openSongModal(song);
            });
            
            card.querySelector('.delete-song').addEventListener('click', () => {
                if (confirm('Delete this song?')) {
                    dataStore.deleteSong(song.id);
                    this.renderSongs();
                    this.renderSetLists();
                }
            });
            
            container.appendChild(card);
        });
    }
    
    renderSetLists() {
        const container = document.getElementById('setlists-container');
        const select = document.getElementById('setlist-select');
        const setLists = dataStore.getAllSetLists();
        
        container.innerHTML = '';
        select.innerHTML = '<option value="">Select a Set List</option>';
        
        if (setLists.length === 0) {
            container.innerHTML = '<p class="empty-state">No set lists yet. Create your first set list!</p>';
            return;
        }
        
        setLists.forEach(setList => {
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = setList.id;
            option.textContent = setList.name;
            select.appendChild(option);
            
            // Calculate set list duration
            const songs = setList.songIds.map(id => dataStore.getSong(id)).filter(s => s);
            const totalDuration = this.calculateSetListDuration(songs);
            const avgBPM = songs.length > 0 ? Math.round(songs.reduce((sum, s) => sum + (s.bpm || 0), 0) / songs.length) : 0;
            
            // Add to container
            const card = document.createElement('div');
            card.className = 'setlist-card';
            
            card.innerHTML = `
                <div class="card-header">
                    <h3>${setList.name}</h3>
                    <div class="card-actions">
                        <button class="btn-icon view-setlist" data-id="${setList.id}" title="View/Print">👁️</button>
                        <button class="btn-icon edit-setlist" data-id="${setList.id}">✏️</button>
                        <button class="btn-icon delete-setlist" data-id="${setList.id}">🗑️</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>${songs.length}</strong> song${songs.length !== 1 ? 's' : ''}</p>
                    <p><strong>Duration:</strong> ${this.formatDuration(totalDuration)}</p>
                    ${avgBPM > 0 ? `<p><strong>Avg BPM:</strong> ${avgBPM}</p>` : ''}
                    <ul class="song-list-inline">
                        ${songs.slice(0, 5).map(s => `<li>${s.name}</li>`).join('')}
                        ${songs.length > 5 ? `<li><em>...and ${songs.length - 5} more</em></li>` : ''}
                    </ul>
                </div>
            `;
            
            card.querySelector('.edit-setlist').addEventListener('click', () => {
                this.openSetListModal(setList);
            });
            
            card.querySelector('.view-setlist').addEventListener('click', () => {
                this.viewSetListDetail(setList);
            });
            
            card.querySelector('.delete-setlist').addEventListener('click', () => {
                if (confirm('Delete this set list?')) {
                    dataStore.deleteSetList(setList.id);
                    this.renderSetLists();
                }
            });
            
            container.appendChild(card);
        });
    }
    
    calculateSetListDuration(songs) {
        let totalSeconds = 0;
        
        songs.forEach(song => {
            if (song.duration) {
                // Use manually entered duration (in minutes)
                totalSeconds += song.duration * 60;
            } else if (song.lyrics && song.lyrics.length > 0) {
                // Calculate from last lyric timestamp
                const lastLyric = song.lyrics[song.lyrics.length - 1];
                totalSeconds += lastLyric.time || 0;
            } else {
                // Default estimate: assume 3 minutes if no duration
                totalSeconds += 180;
            }
        });
        
        return totalSeconds;
    }
    
    formatDuration(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    
    viewSetListDetail(setList) {
        const songs = setList.songIds.map(id => dataStore.getSong(id)).filter(s => s);
        const totalDuration = this.calculateSetListDuration(songs);
        const avgBPM = songs.length > 0 ? Math.round(songs.reduce((sum, s) => sum + (s.bpm || 0), 0) / songs.length) : 0;
        
        // Switch to detail view
        this.switchView('setlist-detail');
        
        // Update detail view
        document.getElementById('setlist-detail-name').textContent = setList.name;
        document.getElementById('detail-song-count').textContent = songs.length;
        document.getElementById('detail-total-duration').textContent = this.formatDuration(totalDuration);
        document.getElementById('detail-avg-bpm').textContent = avgBPM > 0 ? avgBPM : '--';
        
        // Render songs
        const songsList = document.getElementById('setlist-detail-songs');
        songsList.innerHTML = '';
        
        songs.forEach((song, index) => {
            const songDuration = song.duration ? (song.duration * 60) : 
                                (song.lyrics && song.lyrics.length > 0 ? song.lyrics[song.lyrics.length - 1].time : 180);
            
            const item = document.createElement('div');
            item.className = 'detail-song-item';
            item.innerHTML = `
                <div class="detail-song-number">${index + 1}</div>
                <div class="detail-song-info">
                    <div class="detail-song-name">${song.name}${song.artist ? ` <span class="song-artist-small">(${song.artist})</span>` : ''}</div>
                    <div class="detail-song-meta">
                        <span>BPM: ${song.bpm}</span>
                        <span>Duration: ${this.formatDuration(songDuration)}</span>
                        ${song.helixPreset ? `<span>Preset: ${song.helixPreset}</span>` : ''}
                    </div>
                </div>
            `;
            songsList.appendChild(item);
        });
        
        // Setup print button
        document.getElementById('print-setlist-btn').onclick = () => {
            window.print();
        };
        
        // Setup close button
        document.getElementById('close-detail-btn').onclick = () => {
            this.switchView('setlists');
        };
        
        // Store current set list ID for reference
        this.currentDetailSetListId = setList.id;
    }
    
    loadSetList(setListId) {
        const setList = dataStore.getSetList(setListId);
        if (!setList) return;
        
        this.currentSetList = setList;
        this.currentSongIndex = 0;
        
        const songsList = document.getElementById('current-songs-list');
        songsList.innerHTML = '';
        
        // Get songs in the order they're stored in songIds array
        const songs = setList.songIds.map(id => dataStore.getSong(id)).filter(s => s);
        
        // Check if reorder is enabled
        const reorderEnabled = this.reorderEnabled !== false; // Default to enabled if not set
        
        songs.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = `song-item ${index === 0 ? 'active' : ''}`;
            item.draggable = reorderEnabled;
            item.dataset.index = index;
            
            item.innerHTML = `
                <span class="drag-handle-small" title="Drag to reorder">☰</span>
                <span class="song-number">${index + 1}</span>
                <span class="song-name">${song.name}${song.artist ? ` <span class="song-artist-small">(${song.artist})</span>` : ''}</span>
                <span class="song-bpm">${song.bpm} BPM</span>
            `;
            
            item.dataset.songId = song.id;
            
            // Make entire item draggable, but clicking song name selects it
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking drag handle
                if (!e.target.classList.contains('drag-handle-small')) {
                    const songNameEl = item.querySelector('.song-name');
                    if (e.target === songNameEl || songNameEl.contains(e.target)) {
                        this.selectSong(index);
                    }
                }
            });
            
            // Drag and drop for performance view (only if reorder enabled)
            if (reorderEnabled) {
                item.addEventListener('dragstart', (e) => {
                    item.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', song.id);
                });
            }
            
            if (reorderEnabled) {
                item.addEventListener('dragend', (e) => {
                    item.classList.remove('dragging');
                    document.querySelectorAll('.song-item').forEach(i => i.classList.remove('drag-over'));
                    
                    // Update set list order in storage based on new DOM order
                    const items = Array.from(songsList.querySelectorAll('.song-item'));
                    const newSongIds = items.map(item => item.dataset.songId).filter(id => id);
                    
                    if (newSongIds.length === setList.songIds.length) {
                        dataStore.updateSetList(setList.id, { songIds: newSongIds });
                        this.currentSetList.songIds = newSongIds;
                        
                        // Update current song index based on new order
                        const activeSongId = this.currentSong ? this.currentSong.id : null;
                        if (activeSongId) {
                            this.currentSongIndex = newSongIds.indexOf(activeSongId);
                            if (this.currentSongIndex === -1) this.currentSongIndex = 0;
                        }
                        
                        // Re-render to update all numbers and indices
                        this.loadSetList(setListId);
                    }
                });
                
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const afterElement = this.getDragAfterElementPerformance(songsList, e.clientY);
                    const dragging = document.querySelector('.song-item.dragging');
                    if (dragging && afterElement !== dragging) {
                        if (afterElement == null) {
                            songsList.appendChild(dragging);
                        } else {
                            songsList.insertBefore(dragging, afterElement);
                        }
                        this.updatePerformanceSongNumbers();
                    }
                });
                
                item.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    if (!item.classList.contains('dragging')) {
                        item.classList.add('drag-over');
                    }
                });
                
                item.addEventListener('dragleave', () => {
                    item.classList.remove('drag-over');
                });
                
                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    item.classList.remove('drag-over');
                });
            }
            
            songsList.appendChild(item);
        });
        
        if (songs.length > 0) {
            this.selectSong(0);
        }
        
        // Setup reorder toggle button - remove old listeners first
        const toggleBtn = document.getElementById('toggle-reorder-btn');
        const hintEl = document.getElementById('reorder-hint');
        
        if (toggleBtn) {
            this.reorderEnabled = this.reorderEnabled !== false; // Default to enabled
            this.updateReorderButton();
            
            // Clone and replace to remove old listeners
            const newToggleBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
            
            newToggleBtn.addEventListener('click', () => {
                this.reorderEnabled = !this.reorderEnabled;
                this.updateReorderButton();
                // Reload to apply changes
                this.loadSetList(setListId);
            });
        }
    }
    
    updateReorderButton() {
        const toggleBtn = document.getElementById('toggle-reorder-btn');
        const hintEl = document.getElementById('reorder-hint');
        
        if (!toggleBtn) return;
        
        if (this.reorderEnabled) {
            toggleBtn.textContent = '🔒 Lock Order';
            toggleBtn.classList.remove('btn-danger');
            toggleBtn.classList.add('btn-secondary');
            if (hintEl) hintEl.style.display = 'block';
        } else {
            toggleBtn.textContent = '🔓 Enable Reorder';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-danger');
            if (hintEl) hintEl.style.display = 'none';
        }
    }
    
    getDragAfterElementPerformance(container, y) {
        const draggableElements = [...container.querySelectorAll('.song-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    updatePerformanceSongNumbers() {
        const songsList = document.getElementById('current-songs-list');
        const items = Array.from(songsList.querySelectorAll('.song-item'));
        items.forEach((item, index) => {
            const numberSpan = item.querySelector('.song-number');
            if (numberSpan) {
                numberSpan.textContent = index + 1;
            }
            item.dataset.index = index;
        });
    }
    
    selectSong(index) {
        if (!this.currentSetList) return;
        
        // Save current song changes if any - but only prompt if there are significant changes
        // Auto-save minor changes (BPM, time signature) to avoid annoying prompts
        if (this.songHasChanges && this.currentSong) {
            // Auto-save changes silently when switching songs (BPM/time sig changes are usually intentional)
            // Only show prompt for major changes if needed in the future
            this.saveSongChanges();
        }
        
        const songs = this.currentSetList.songIds.map(id => dataStore.getSong(id)).filter(s => s);
        if (index < 0 || index >= songs.length) return;
        
        this.currentSongIndex = index;
        this.currentSong = songs[index];
        
        // Store original state for comparison
        this.originalSongState = JSON.parse(JSON.stringify(this.currentSong));
        this.songHasChanges = false;
        this.hideSaveSection();
        
        // Update UI
        document.querySelectorAll('.song-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        document.getElementById('current-song-name').textContent = this.currentSong.name;
        document.getElementById('bpm-value').textContent = this.currentSong.bpm;
        document.getElementById('bpm-slider').value = this.currentSong.bpm;
        document.getElementById('helix-preset-name').textContent = this.currentSong.helixPreset || 'None';
        
        // Send Helix program change if preset number is set
        if (this.currentSong.helixPresetNumber !== undefined && this.currentSong.helixPresetNumber !== null) {
            this.sendHelixPresetChange(this.currentSong.helixPresetNumber);
        }
        
        // Update metronome
        const timeSignature = this.currentSong.timeSignature || 4;
        this.metronome.setBPM(this.currentSong.bpm);
        this.metronome.setTimeSignature(timeSignature);
        this.metronome.setLyrics(this.currentSong.lyrics || []);
        
        // Update beat pattern selector
        this.updateBeatPatternSelector(timeSignature);
        
        // If song has accent pattern, use it; otherwise default to no accents
        if (this.currentSong.accentPattern && Array.isArray(this.currentSong.accentPattern)) {
            this.metronome.setAccentPattern(this.currentSong.accentPattern);
            // Update UI to show pattern
            setTimeout(() => {
                this.updateBeatPatternSelector(timeSignature);
            }, 10);
        } else {
            // Default: no accents (all false)
            const pattern = new Array(timeSignature).fill(false);
            this.metronome.setAccentPattern(pattern);
        }
        
        // Update UI controls to match song
        this.updateBPM(this.currentSong.bpm);
        const timeSigSelect = document.getElementById('time-signature-select');
        if (timeSigSelect) {
            timeSigSelect.value = timeSignature;
        }
        this.updateTimeSignatureDisplay(timeSignature);
        
        // Set polyrhythm if song has one
        if (this.currentSong.polyrhythm) {
            document.getElementById('polyrhythm-select').value = this.currentSong.polyrhythm.name || 'custom';
            if (this.currentSong.polyrhythm.name === 'custom') {
                document.getElementById('custom-polyrhythm-group').style.display = 'block';
                document.getElementById('custom-polyrhythm').value = this.currentSong.polyrhythm.pattern.join(',');
            }
            this.metronome.setPolyrhythm(this.currentSong.polyrhythm.pattern, this.currentSong.polyrhythm.name);
        } else {
            document.getElementById('polyrhythm-select').value = '';
            document.getElementById('custom-polyrhythm-group').style.display = 'none';
            this.metronome.setPolyrhythm(null);
        }
        
        // Update lyrics display
        this.updateLyricsDisplay();
        
        // Send MIDI notes to lights if configured (separate from Helix)
        if (this.currentSong.midiNotes && this.currentSong.midiNotes.length > 0) {
            midiController.sendNotesToLights(this.currentSong.midiNotes, 127);
        }
        
        // Stop metronome when switching songs
        if (this.metronome.isPlaying) {
            this.metronome.stop();
            document.getElementById('play-pause-btn').classList.remove('playing');
            document.getElementById('play-icon').style.display = 'inline';
            document.getElementById('pause-icon').style.display = 'none';
            document.getElementById('btn-text').textContent = 'Start';
        }
    }
    
    markSongChanged() {
        if (this.currentSong) {
            this.songHasChanges = true;
            this.showSaveSection();
        }
    }
    
    showSaveSection() {
        const saveSection = document.getElementById('save-changes-section');
        if (saveSection) {
            saveSection.style.display = 'block';
        }
    }
    
    hideSaveSection() {
        const saveSection = document.getElementById('save-changes-section');
        if (saveSection) {
            saveSection.style.display = 'none';
        }
    }
    
    saveSongChanges(overwrite = false) {
        if (!this.currentSong) return;
        
        // Get current state
        const updates = {
            bpm: this.metronome.bpm,
            timeSignature: this.metronome.timeSignature,
            accentPattern: this.metronome.accentPattern ? [...this.metronome.accentPattern] : null,
            polyrhythm: this.metronome.polyrhythm ? { ...this.metronome.polyrhythm } : null
        };
        
        // Update song in storage
        dataStore.updateSong(this.currentSong.id, updates);
        
        // Update current song reference
        Object.assign(this.currentSong, updates);
        this.originalSongState = JSON.parse(JSON.stringify(this.currentSong));
        this.songHasChanges = false;
        this.hideSaveSection();
        
        // Show feedback
        const saveBtn = document.getElementById('save-song-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span>✓ Saved!</span>';
        saveBtn.style.background = 'var(--success)';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
        }, 1500);
        
        console.log('Song saved:', this.currentSong.name);
    }
    
    previousSong() {
        if (this.currentSetList) {
            this.selectSong(this.currentSongIndex - 1);
        }
    }
    
    nextSong() {
        if (this.currentSetList) {
            this.selectSong(this.currentSongIndex + 1);
        }
    }
    
    updateLyricsDisplay() {
        const display = document.getElementById('lyrics-display');
        const currentLyric = this.metronome.getCurrentLyric();
        
        if (!this.currentSong || !this.currentSong.lyrics || this.currentSong.lyrics.length === 0) {
            display.innerHTML = '<p class="lyrics-placeholder">No lyrics for this song</p>';
            return;
        }
        
        if (!currentLyric) {
            display.innerHTML = '<p class="lyrics-placeholder">Ready...</p>';
            return;
        }
        
        // Show current and upcoming lyrics
        const currentIndex = this.metronome.currentLyricIndex;
        const lyrics = this.currentSong.lyrics;
        
        let html = '';
        for (let i = Math.max(0, currentIndex - 2); i < Math.min(lyrics.length, currentIndex + 5); i++) {
            const lyric = lyrics[i];
            const isCurrent = i === currentIndex;
            html += `<p class="lyric-line ${isCurrent ? 'current' : ''}">${lyric.text}</p>`;
        }
        
        display.innerHTML = html || '<p class="lyrics-placeholder">No lyrics</p>';
    }
    
    getPolyrhythmPattern(name) {
        const patterns = {
            '3:2': [1, 0, 0, 1, 0, 0], // 3 over 2
            '4:3': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // 4 over 3
            '5:4': [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0] // 5 over 4
        };
        return patterns[name] || null;
    }
    
    applyCustomPolyrhythm(input) {
        try {
            const pattern = input.split(',').map(val => {
                const trimmed = val.trim();
                return trimmed === '1' ? 1 : 0;
            });
            
            if (pattern.length > 0 && pattern.every(p => p === 0 || p === 1)) {
                this.metronome.setPolyrhythm(pattern, 'custom');
            }
        } catch (e) {
            console.error('Invalid polyrhythm pattern:', e);
        }
    }
    
    updateBeatPatternSelector(timeSignature) {
        const selector = document.getElementById('beat-pattern-selector');
        if (!selector) return;
        
        // Get current pattern or create default (first beat accented)
        let currentPattern = null;
        
        // First try metronome's current pattern
        if (this.metronome.accentPattern && this.metronome.accentPattern.length === timeSignature) {
            currentPattern = [...this.metronome.accentPattern];
        }
        // Then try song's pattern
        else if (this.currentSong && this.currentSong.accentPattern && Array.isArray(this.currentSong.accentPattern)) {
            currentPattern = [...this.currentSong.accentPattern];
        }
        // Default: NO accents (all false) - uniform click
        else {
            currentPattern = new Array(timeSignature).fill(false);
        }
        
        // Ensure pattern matches time signature length
        if (currentPattern.length !== timeSignature) {
            if (currentPattern.length < timeSignature) {
                currentPattern = [...currentPattern, ...new Array(timeSignature - currentPattern.length).fill(false)];
            } else {
                currentPattern = currentPattern.slice(0, timeSignature);
            }
        }
        
        selector.innerHTML = '';
        
        for (let i = 0; i < timeSignature; i++) {
            const beatBtn = document.createElement('button');
            beatBtn.type = 'button';
            beatBtn.className = `beat-btn ${currentPattern[i] ? 'accented' : ''}`;
            beatBtn.dataset.beatIndex = i;
            beatBtn.textContent = i + 1;
            beatBtn.setAttribute('aria-label', `Beat ${i + 1}`);
            
            beatBtn.addEventListener('click', () => {
                this.toggleBeatAccent(i);
            });
            
            selector.appendChild(beatBtn);
        }
        
        // Update metronome with current pattern
        this.metronome.setAccentPattern(currentPattern);
    }
    
    toggleBeatAccent(beatIndex) {
        const timeSignature = this.metronome.timeSignature;
        let pattern = this.metronome.accentPattern || new Array(timeSignature).fill(false);
        
        if (pattern.length !== timeSignature) {
            pattern = new Array(timeSignature).fill(false);
            if (this.metronome.accentPattern) {
                pattern.forEach((_, i) => {
                    if (i < this.metronome.accentPattern.length) {
                        pattern[i] = this.metronome.accentPattern[i];
                    }
                });
            }
        }
        
        // Toggle the beat
        pattern[beatIndex] = !pattern[beatIndex];
        
        // Update UI
        const beatBtn = document.querySelector(`#beat-pattern-selector .beat-btn[data-beat-index="${beatIndex}"]`);
        if (beatBtn) {
            beatBtn.classList.toggle('accented', pattern[beatIndex]);
        }
        
        // Update metronome
        this.metronome.setAccentPattern(pattern);
        
        // Update song if loaded
        if (this.currentSong) {
            this.currentSong.accentPattern = pattern;
            this.markSongChanged();
        }
    }
    
    clearAllAccents() {
        const timeSignature = this.metronome.timeSignature;
        const pattern = new Array(timeSignature).fill(false);
        this.metronome.setAccentPattern(pattern);
        
        // Update UI
        document.querySelectorAll('#beat-pattern-selector .beat-btn').forEach(btn => {
            btn.classList.remove('accented');
        });
        
        // Update song if loaded
        if (this.currentSong) {
            this.currentSong.accentPattern = pattern;
            this.markSongChanged();
        }
    }
    
    setNoAccent() {
        this.clearAllAccents();
        // Also disable accent sound by using a pattern with all false
    }
    
    updateTimeSignatureDisplay(timeSignature) {
        const display = document.getElementById('time-signature-display');
        if (!display) return;
        
        // Map numeric time signature to display format
        const timeSigMap = {
            2: '2/4',
            3: '3/4',
            4: '4/4',
            5: '5/4',
            6: '6/8',
            7: '7/8',
            9: '9/8',
            12: '12/8'
        };
        
        display.textContent = timeSigMap[timeSignature] || `${timeSignature}/4`;
    }
    
    updateBPM(bpm) {
        bpm = Math.max(40, Math.min(300, bpm));
        this.metronome.setBPM(bpm);
        document.getElementById('bpm-value').textContent = bpm;
        document.getElementById('wheel-bpm-value').textContent = bpm;
        document.getElementById('bpm-slider').value = bpm;
        
        // Update wheel rotation if function exists
        if (this.updateTempoWheel) {
            this.updateTempoWheel(bpm);
        }
        
        // Update song if loaded and mark as changed
        if (this.currentSong) {
            this.currentSong.bpm = bpm;
            this.markSongChanged();
        }
    }
    
    setupTempoWheel() {
        const wheel = document.getElementById('tempo-wheel');
        if (!wheel) {
            console.error('Tempo wheel element not found');
            return;
        }
        let isDragging = false;
        let startAngle = 0;
        let startBPM = 120;
        let lastAngle = 0;
        
        const getAngle = (e) => {
            const rect = wheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            const dx = clientX - centerX;
            const dy = clientY - centerY;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Normalize to 0-360
            if (angle < 0) angle += 360;
            
            // Rotate so 0 degrees is at top (12 o'clock)
            angle = (angle + 90) % 360;
            if (angle < 0) angle += 360;
            
            return angle;
        };
        
        const bpmFromAngle = (angle) => {
            // Map 360 degrees to BPM range (40-300)
            const normalized = angle / 360;
            const bpm = Math.round(40 + (normalized * 260));
            return Math.max(40, Math.min(300, bpm));
        };
        
        const angleFromBPM = (bpm) => {
            // Map BPM (40-300) to angle (0-360)
            const normalized = (bpm - 40) / 260;
            return normalized * 360;
        };
        
        const updateWheelRotation = (bpm) => {
            const angle = angleFromBPM(bpm);
            // Rotate the background wheel (text stays upright)
            const wheelBackground = wheel.querySelector('.wheel-background');
            if (wheelBackground) {
                // Rotate the background to show position
                // When BPM = 40, angle = 0, background at 0°
                // When BPM = 300, angle = 360, background at 360°
                wheelBackground.style.transform = `rotate(${angle}deg)`;
            } else {
                console.warn('Wheel background element not found');
            }
        };
        
        // Store update function for external use (tap tempo, slider, etc)
        this.updateTempoWheel = updateWheelRotation;
        
        // Initialize wheel rotation immediately and on page load
        updateWheelRotation(this.metronome.bpm);
        setTimeout(() => {
            updateWheelRotation(this.metronome.bpm);
        }, 100);
        
        const startDrag = (e) => {
            e.preventDefault();
            isDragging = true;
            wheel.classList.add('active');
            
            // Get mouse/touch position angle relative to wheel center
            const mouseAngle = getAngle(e);
            
            // Store starting state
            startAngle = mouseAngle;
            startBPM = this.metronome.bpm;
            lastAngle = mouseAngle;
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentAngle = getAngle(e);
            let deltaAngle = currentAngle - lastAngle;
            
            // Handle wrap-around at 0/360 boundary
            if (deltaAngle > 180) {
                deltaAngle -= 360;
            } else if (deltaAngle < -180) {
                deltaAngle += 360;
            }
            
            // Only process significant movements (ignore tiny jitter) - increased threshold for less sensitivity
            if (Math.abs(deltaAngle) < 3) {
                return;
            }
            
            // Calculate angle delta from start
            let angleDelta = currentAngle - startAngle;
            
            // Handle wrap-around for total delta
            if (angleDelta > 180) {
                angleDelta -= 360;
            } else if (angleDelta < -180) {
                angleDelta += 360;
            }
            
            // Calculate new BPM based on start BPM + angle change
            const startAngleForBPM = angleFromBPM(startBPM);
            let newAngle = startAngleForBPM + angleDelta;
            
            // Normalize to 0-360
            newAngle = ((newAngle % 360) + 360) % 360;
            
            // Calculate BPM from angle
            const newBPM = bpmFromAngle(newAngle);
            
            // Only update if BPM changed significantly (reduce sensitivity)
            const currentBPM = this.metronome.bpm;
            if (Math.abs(newBPM - currentBPM) >= 1) {
                this.updateBPM(newBPM);
                updateWheelRotation(newBPM);
            }
            
            lastAngle = currentAngle;
        };
        
        const endDrag = () => {
            if (isDragging) {
                isDragging = false;
                wheel.classList.remove('active');
            }
        };
        
        // Mouse events
        wheel.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        
        // Touch events
        wheel.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
        
        // Wheel scroll on the wheel
        wheel.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            const newBPM = this.metronome.bpm + delta;
            this.updateBPM(newBPM);
            updateWheelRotation(newBPM);
        }, { passive: false });
    }
    
    tapTempo() {
        const now = Date.now();
        if (!this.tapTimes) {
            this.tapTimes = [];
        }
        
        // Keep only taps from last 2 seconds
        this.tapTimes = this.tapTimes.filter(time => now - time < 2000);
        this.tapTimes.push(now);
        
        if (this.tapTimes.length >= 2) {
            // Calculate average interval between taps
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            
            // Convert milliseconds to BPM
            const bpm = Math.round(60000 / avgInterval);
            
            // Clamp to valid range
            const clampedBPM = Math.max(40, Math.min(300, bpm));
            this.updateBPM(clampedBPM);
            // Note: updateBPM already marks song as changed
            
            // Update wheel rotation
            if (this.updateTempoWheel) {
                this.updateTempoWheel(clampedBPM);
            }
        }
        
        // Visual feedback
        const btn = document.getElementById('tap-tempo-btn');
        btn.classList.add('active');
        setTimeout(() => {
            btn.classList.remove('active');
        }, 150);
    }
    
    openImportModal() {
        const modal = document.getElementById('import-modal');
        document.getElementById('import-data').value = '';
        modal.style.display = 'block';
    }
    
    importSongs() {
        const importData = document.getElementById('import-data').value.trim();
        if (!importData) {
            alert('Please paste song data');
            return;
        }
        
        const lines = importData.split('\n').filter(line => line.trim());
        const imported = [];
        const errors = [];
        
        lines.forEach((line, index) => {
            try {
                // Parse line - could be tab or space separated
                const parts = line.split(/\t|\s{2,}/).filter(p => p.trim());
                
                if (parts.length < 2) {
                    // Try splitting by single space if no tabs found
                    const spaceParts = line.trim().split(/\s+/);
                    if (spaceParts.length >= 2) {
                        // Last number is likely BPM
                        const bpmMatch = spaceParts[spaceParts.length - 1].match(/\d+/);
                        if (bpmMatch) {
                            const bpm = parseInt(bpmMatch[0]);
                            const songName = spaceParts.slice(0, -1).join(' ').replace(/^\d+:\d+:\d+\s+(AM|PM)\s+/i, '').trim();
                            
                            if (songName && bpm >= 40 && bpm <= 300) {
                                // Extract artist if format is "Artist - Song"
                                let artist = '';
                                let title = songName;
                                if (songName.includes(' - ')) {
                                    const artistParts = songName.split(' - ');
                                    artist = artistParts[0].trim();
                                    title = artistParts.slice(1).join(' - ').trim();
                                }
                                
                                // Get key if present (last part that looks like a key: A, B, C, D, E, F, G, or with "major"/"minor")
                                let key = '';
                                const keyParts = line.match(/\b([A-G](?:\s*(?:major|minor|maj|min))?)\b/i);
                                if (keyParts) {
                                    key = keyParts[1];
                                }
                                
                                const song = {
                                    name: title,
                                    artist: artist,
                                    bpm: bpm,
                                    timeSignature: 4,
                                    helixPreset: key || '',
                                    lyrics: [],
                                    midiNotes: []
                                };
                                
                                dataStore.addSong(song);
                                imported.push(song);
                                return;
                            }
                        }
                    }
                    errors.push(`Line ${index + 1}: Could not parse - ${line.substring(0, 50)}...`);
                    return;
                }
                
                // Standard parsing: song name, BPM, optional key
                let songName = parts[0].trim();
                let bpm = null;
                let key = '';
                
                // Find BPM (last numeric value between 40-300)
                for (let i = parts.length - 1; i >= 0; i--) {
                    const num = parseInt(parts[i]);
                    if (!isNaN(num) && num >= 40 && num <= 300) {
                        bpm = num;
                        // Everything before this is song name
                        songName = parts.slice(0, i).join(' ').trim();
                        // Check if there's a key after BPM
                        if (i + 1 < parts.length) {
                            const keyCandidate = parts[i + 1].trim().toUpperCase();
                            if (/^[A-G](?:major|minor|maj|min)?$/i.test(keyCandidate)) {
                                key = keyCandidate;
                            }
                        }
                        break;
                    }
                }
                
                // Clean song name - remove time stamps if present
                songName = songName.replace(/^\d+:\d+:\d+\s+(AM|PM)\s+/i, '').trim();
                
                if (!songName || !bpm) {
                    errors.push(`Line ${index + 1}: Missing song name or BPM - ${line.substring(0, 50)}...`);
                    return;
                }
                
                // Extract artist if format is "Artist - Song"
                let artist = '';
                let title = songName;
                if (songName.includes(' - ')) {
                    const artistParts = songName.split(' - ');
                    artist = artistParts[0].trim();
                    title = artistParts.slice(1).join(' - ').trim();
                }
                
                const song = {
                    name: title,
                    artist: artist,
                    bpm: bpm,
                    timeSignature: 4,
                    helixPreset: key || '',
                    lyrics: [],
                    midiNotes: []
                };
                
                dataStore.addSong(song);
                imported.push(song);
                
            } catch (e) {
                errors.push(`Line ${index + 1}: Error - ${e.message}`);
            }
        });
        
        document.getElementById('import-modal').style.display = 'none';
        
        let message = `Imported ${imported.length} song${imported.length !== 1 ? 's' : ''}.`;
        if (errors.length > 0) {
            message += `\n\n${errors.length} error${errors.length !== 1 ? 's' : ''}:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
                message += `\n...and ${errors.length - 5} more`;
            }
        }
        
        alert(message);
        this.renderSongs();
    }
    
    openExportModal() {
        const modal = document.getElementById('data-export-modal');
        const exportTextarea = document.getElementById('export-data-textarea');
        const importTextarea = document.getElementById('import-data-textarea');
        
        // Populate export textarea with current data
        const exportData = this.exportAllData();
        exportTextarea.value = exportData;
        
        // Clear import textarea
        importTextarea.value = '';
        
        modal.style.display = 'block';
    }
    
    exportAllData() {
        // Reload from localStorage to ensure we have latest data
        dataStore.load();
        const songs = dataStore.getAllSongs();
        const setLists = dataStore.getAllSetLists();
        
        const allData = {
            songs: songs,
            setLists: setLists,
            version: '1.0',
            exportDate: new Date().toISOString(),
            stats: {
                songCount: songs.length,
                setListCount: setLists.length
            }
        };
        
        console.log('Exporting data:', { songs: songs.length, setLists: setLists.length });
        return JSON.stringify(allData, null, 2);
    }
    
    importAllData(replace = true) {
        const importTextarea = document.getElementById('import-data-textarea');
        const importData = importTextarea.value.trim();
        
        if (!importData) {
            alert('Please paste exported data');
            return;
        }
        
        if (replace) {
            if (!confirm('⚠️ This will REPLACE all your current songs and set lists. Are you sure?')) {
                return;
            }
        }
        
        try {
            const data = JSON.parse(importData);
            
            // Validate data structure
            if (!Array.isArray(data.songs)) {
                throw new Error('Invalid data format. Expected songs array.');
            }
            
            if (!Array.isArray(data.setLists)) {
                throw new Error('Invalid data format. Expected setLists array.');
            }
            
            if (replace) {
                // Replace all data
                dataStore.songs = data.songs || [];
                dataStore.setLists = data.setLists || [];
            } else {
                // Merge data - add new songs/set lists without duplicates
                const existingSongNames = new Set(dataStore.songs.map(s => `${s.name}|${s.artist || ''}`.toLowerCase()));
                const existingSetListNames = new Set(dataStore.setLists.map(sl => sl.name.toLowerCase()));
                
                let newSongs = 0;
                let skippedSongs = 0;
                
                data.songs.forEach(song => {
                    const key = `${song.name}|${song.artist || ''}`.toLowerCase();
                    if (!existingSongNames.has(key)) {
                        dataStore.songs.push(song);
                        existingSongNames.add(key);
                        newSongs++;
                    } else {
                        skippedSongs++;
                    }
                });
                
                let newSetLists = 0;
                let skippedSetLists = 0;
                
                data.setLists.forEach(setList => {
                    if (!existingSetListNames.has(setList.name.toLowerCase())) {
                        dataStore.setLists.push(setList);
                        existingSetListNames.add(setList.name.toLowerCase());
                        newSetLists++;
                    } else {
                        skippedSetLists++;
                    }
                });
                
                dataStore.save();
                
                // Show merge results
                let message = `✅ Merged successfully!\n\n`;
                message += `Songs: +${newSongs} new`;
                if (skippedSongs > 0) message += `, ${skippedSongs} duplicates skipped`;
                message += `\nSet Lists: +${newSetLists} new`;
                if (skippedSetLists > 0) message += `, ${skippedSetLists} duplicates skipped`;
                
                alert(message);
            }
            
            dataStore.save();
            
            // Reload from storage
            dataStore.load();
            
            console.log('Imported:', { songs: dataStore.songs.length, setLists: dataStore.setLists.length });
            
            // Refresh UI
            this.renderSongs();
            this.renderSetLists();
            
            // Close modal
            document.getElementById('data-export-modal').style.display = 'none';
            
            // Clear import textarea
            importTextarea.value = '';
            
            if (replace) {
                alert(`✅ Successfully imported ${data.songs.length} song${data.songs.length !== 1 ? 's' : ''} and ${data.setLists.length} set list${data.setLists.length !== 1 ? 's' : ''}!`);
            }
            
        } catch (e) {
            alert(`❌ Error importing data: ${e.message}\n\nMake sure you copied the complete JSON data.`);
            console.error('Import error:', e);
        }
    }
    
    setupInstallPrompt() {
        let deferredPrompt;
        const installPrompt = document.getElementById('install-prompt');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installPrompt.style.display = 'block';
            
            installPrompt.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response: ${outcome}`);
                    deferredPrompt = null;
                    installPrompt.style.display = 'none';
                }
            });
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            installPrompt.style.display = 'none';
            deferredPrompt = null;
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PerformanceApp();
});
