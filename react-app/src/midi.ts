// MIDI Controller Class

export class MIDIController {
  output: MIDIOutput | null;
  helixOutput: MIDIOutput | null;
  lightsOutput: MIDIOutput | null;
  outputs: MIDIOutput[];
  isSupported: boolean;

  constructor() {
    this.output = null;
    this.helixOutput = null;
    this.lightsOutput = null;
    this.outputs = [];
    this.isSupported = navigator.requestMIDIAccess !== undefined;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Web MIDI API not supported');
      return false;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      this.updateOutputs(access);
      access.onstatechange = () => {
        this.updateOutputs(access);
      };
      return true;
    } catch (err) {
      console.error('MIDI access denied:', err);
      return false;
    }
  }

  updateOutputs(access: MIDIAccess): MIDIOutput[] {
    this.outputs = [];
    const outputIterator = access.outputs.values();
    for (const output of outputIterator) {
      this.outputs.push(output);
    }
    return this.outputs;
  }

  getOutputs(): MIDIOutput[] {
    return this.outputs;
  }

  setOutput(outputIndex: number): boolean {
    if (outputIndex >= 0 && outputIndex < this.outputs.length) {
      this.output = this.outputs[outputIndex]!;
      return true;
    }
    return false;
  }

  setHelixOutput(outputIndex: number): boolean {
    if (outputIndex >= 0 && outputIndex < this.outputs.length) {
      this.helixOutput = this.outputs[outputIndex]!;
      return true;
    }
    return false;
  }

  setLightsOutput(outputIndex: number): boolean {
    if (outputIndex >= 0 && outputIndex < this.outputs.length) {
      this.lightsOutput = this.outputs[outputIndex]!;
      return true;
    }
    return false;
  }

  getHelixOutput(): MIDIOutput | null {
    return this.helixOutput || this.output;
  }

  getLightsOutput(): MIDIOutput | null {
    return this.lightsOutput || this.output;
  }

  sendNoteOn(note: number, velocity: number = 127, channel: number = 0): boolean {
    if (!this.output) {
      console.warn('No MIDI output selected');
      return false;
    }

    const noteOnMessage: number[] = [0x90 + channel, note, velocity];
    this.output.send(noteOnMessage);
    return true;
  }

  sendNoteOff(note: number, channel: number = 0): boolean {
    if (!this.output) {
      console.warn('No MIDI output selected');
      return false;
    }

    const noteOffMessage: number[] = [0x80 + channel, note, 0];
    this.output.send(noteOffMessage);
    return true;
  }

  sendCC(controller: number, value: number, channel: number = 0): boolean {
    if (!this.output) {
      console.warn('No MIDI output selected');
      return false;
    }

    const ccMessage: number[] = [0xB0 + channel, controller, value];
    this.output.send(ccMessage);
    return true;
  }

  sendProgramChange(program: number, channel: number = 0, useHelixOutput: boolean = false): boolean {
    const output = useHelixOutput ? this.getHelixOutput() : this.output;

    if (!output) {
      console.warn('No MIDI output selected');
      return false;
    }

    const pcMessage: number[] = [0xC0 + channel, program];
    output.send(pcMessage);
    return true;
  }

  // Send to lights specifically
  sendNoteOnToLights(note: number, velocity: number = 127, channel: number = 0): boolean {
    const output = this.getLightsOutput();
    if (!output) {
      console.warn('No lights MIDI output selected');
      return false;
    }

    const noteOnMessage: number[] = [0x90 + channel, note, velocity];
    output.send(noteOnMessage);
    return true;
  }

  sendNoteOffToLights(note: number, channel: number = 0): boolean {
    const output = this.getLightsOutput();
    if (!output) {
      console.warn('No lights MIDI output selected');
      return false;
    }

    const noteOffMessage: number[] = [0x80 + channel, note, 0];
    output.send(noteOffMessage);
    return true;
  }

  sendNotesToLights(notes: number[], velocity: number = 127, channel: number = 0): boolean {
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
  sendNotes(notes: number[], velocity: number = 127, channel: number = 0): boolean {
    if (!this.output) return false;

    notes.forEach(note => {
      if (typeof note === 'number') {
        this.sendNoteOn(note, velocity, channel);
      }
    });
    return true;
  }

  // Send notes at specific times (relative to BPM)
  scheduleNotes(notes: number[], times: number[], bpm: number, channel: number = 0): boolean {
    if (!this.output || !times || times.length !== notes.length) return false;

    const beatDuration = 60 / bpm; // Duration of one beat in seconds

    notes.forEach((note, index) => {
      const delay = times[index]! * beatDuration * 1000; // Convert to milliseconds
      setTimeout(() => {
        this.sendNoteOn(note, 127, channel);
      }, delay);
    });

    return true;
  }
}

// Global MIDI controller instance
export const midiController = new MIDIController();

