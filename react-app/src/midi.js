// MIDI Controller Class

class MIDIController {
    constructor() {
        this.output = null; // Primary output (default)
        this.helixOutput = null; // Helix output (for preset changes)
        this.lightsOutput = null; // Lights output (for lighting control)
        this.outputs = [];
        this.isSupported = navigator.requestMIDIAccess !== undefined;
    }
    
    async initialize() {
        if (!this.isSupported) {
            console.warn('Web MIDI API not supported');
            return false;
        }
        
        try {
            const access = await navigator.requestMIDIAccess({ sysex: false });
            this.updateOutputs(access);
            access.onstatechange = (e) => {
                this.updateOutputs(access);
            };
            return true;
        } catch (err) {
            console.error('MIDI access denied:', err);
            return false;
        }
    }
    
    updateOutputs(access) {
        this.outputs = [];
        const outputIterator = access.outputs.values();
        for (const output of outputIterator) {
            this.outputs.push(output);
        }
        return this.outputs;
    }
    
    getOutputs() {
        return this.outputs;
    }
    
    setOutput(outputIndex) {
        if (outputIndex >= 0 && outputIndex < this.outputs.length) {
            this.output = this.outputs[outputIndex];
            return true;
        }
        return false;
    }
    
    setHelixOutput(outputIndex) {
        if (outputIndex >= 0 && outputIndex < this.outputs.length) {
            this.helixOutput = this.outputs[outputIndex];
            return true;
        }
        return false;
    }
    
    setLightsOutput(outputIndex) {
        if (outputIndex >= 0 && outputIndex < this.outputs.length) {
            this.lightsOutput = this.outputs[outputIndex];
            return true;
        }
        return false;
    }
    
    getHelixOutput() {
        return this.helixOutput || this.output;
    }
    
    getLightsOutput() {
        return this.lightsOutput || this.output;
    }
    
    sendNoteOn(note, velocity = 127, channel = 0) {
        if (!this.output) {
            console.warn('No MIDI output selected');
            return false;
        }
        
        const noteOnMessage = [0x90 + channel, note, velocity];
        this.output.send(noteOnMessage);
        return true;
    }
    
    sendNoteOff(note, channel = 0) {
        if (!this.output) {
            console.warn('No MIDI output selected');
            return false;
        }
        
        const noteOffMessage = [0x80 + channel, note, 0];
        this.output.send(noteOffMessage);
        return true;
    }
    
    sendCC(controller, value, channel = 0) {
        if (!this.output) {
            console.warn('No MIDI output selected');
            return false;
        }
        
        const ccMessage = [0xB0 + channel, controller, value];
        this.output.send(ccMessage);
        return true;
    }
    
    sendProgramChange(program, channel = 0, useHelixOutput = false) {
        const output = useHelixOutput ? this.getHelixOutput() : this.output;
        
        if (!output) {
            console.warn('No MIDI output selected');
            return false;
        }
        
        const pcMessage = [0xC0 + channel, program];
        output.send(pcMessage);
        return true;
    }
    
    // Send to lights specifically
    sendNoteOnToLights(note, velocity = 127, channel = 0) {
        const output = this.getLightsOutput();
        if (!output) {
            console.warn('No lights MIDI output selected');
            return false;
        }
        
        const noteOnMessage = [0x90 + channel, note, velocity];
        output.send(noteOnMessage);
        return true;
    }
    
    sendNoteOffToLights(note, channel = 0) {
        const output = this.getLightsOutput();
        if (!output) {
            console.warn('No lights MIDI output selected');
            return false;
        }
        
        const noteOffMessage = [0x80 + channel, note, 0];
        output.send(noteOffMessage);
        return true;
    }
    
    sendNotesToLights(notes, velocity = 127, channel = 0) {
        const output = this.getLightsOutput();
        if (!output) return false;
        
        notes.forEach(note => {
            if (typeof note === 'number') {
                this.sendNoteOnToLights(note, velocity, channel);
            }
        });
        return true;
    }
    
    // Send multiple notes (for light sequences)
    sendNotes(notes, velocity = 127, channel = 0) {
        if (!this.output) return false;
        
        notes.forEach(note => {
            if (typeof note === 'number') {
                this.sendNoteOn(note, velocity, channel);
            }
        });
        return true;
    }
    
    // Send notes at specific times (relative to BPM)
    scheduleNotes(notes, times, bpm, channel = 0) {
        if (!this.output || !times || times.length !== notes.length) return false;
        
        const beatDuration = 60 / bpm; // Duration of one beat in seconds
        const currentTime = performance.now();
        
        notes.forEach((note, index) => {
            const delay = times[index] * beatDuration * 1000; // Convert to milliseconds
            setTimeout(() => {
                this.sendNoteOn(note, 127, channel);
            }, delay);
        });
        
        return true;
    }
}

// Global MIDI controller instance
const midiController = new MIDIController();

export { MIDIController, midiController };

