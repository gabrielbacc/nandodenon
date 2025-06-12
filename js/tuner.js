// Definindo a classe no escopo global
window.GuitarTuner = class GuitarTuner {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.isRunning = false;
        this.noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.standardTuning = {
            'E2': 82.41,
            'A2': 110.00,
            'D3': 146.83,
            'G3': 196.00,
            'B3': 246.94,
            'E4': 329.63
        };
        this.minFrequency = 40;
        this.maxFrequency = 1000;
        this.debugMode = true;
        
        // Tolerância em cents (100 cents = 1 semitom)
        this.tolerance = 5;
    }

    async start() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            // Configurações do analisador para melhor precisão
            this.analyser.fftSize = 4096;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;
            this.analyser.smoothingTimeConstant = 0.85;

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            this.mediaStream = stream;
            
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            this.isRunning = true;
            this.updatePitch();

            if (this.debugMode) {
                this.debugAudioInput();
            }
        } catch (error) {
            console.error('Erro ao iniciar o afinador:', error);
            throw error;
        }
    }

    findNearestNote(frequency) {
        // Encontra a nota mais próxima na escala temperada
        const noteNum = 12 * (Math.log2(frequency / 440));
        const roundedNoteNum = Math.round(noteNum);
        const standardFrequency = 440 * Math.pow(2, roundedNoteNum / 12);
        
        // Calcula a diferença em cents
        const cents = Math.round(1200 * Math.log2(frequency / standardFrequency));
        
        // Encontra o nome da nota
        const noteIndex = ((roundedNoteNum % 12) + 12) % 12;
        const noteName = this.noteStrings[noteIndex];
        
        // Encontra a oitava
        const octave = Math.floor((roundedNoteNum + 69) / 12);
        
        return {
            name: noteName,
            frequency: standardFrequency,
            cents: cents,
            octave: octave
        };
    }

    findClosestGuitarString(frequency) {
        let closestString = null;
        let minDifference = Infinity;
        
        for (const [note, freq] of Object.entries(this.standardTuning)) {
            const difference = Math.abs(Math.log2(frequency / freq));
            if (difference < minDifference) {
                minDifference = difference;
                closestString = { note, frequency: freq };
            }
        }
        
        return closestString;
    }

    updateTunerDisplay(frequency) {
        if (!frequency || frequency <= 0) {
            document.getElementById('tuner-note').textContent = '--';
            document.getElementById('tuner-freq').textContent = '--';
            document.getElementById('tuner-status').textContent = 'Aguardando...';
            document.getElementById('tuner-reference').textContent = '';
            document.getElementById('tuner-needle').style.left = '50%';
            return;
        }

        // Encontra a nota mais próxima
        const noteInfo = this.findNearestNote(frequency);
        const guitarString = this.findClosestGuitarString(frequency);
        
        // Atualiza o display da nota e frequência
        document.getElementById('tuner-note').textContent = noteInfo.name;
        document.getElementById('tuner-freq').textContent = Math.round(frequency) + ' Hz';
        
        // Atualiza a referência da corda do violão
        if (guitarString) {
            document.getElementById('tuner-reference').textContent = 
                `Corda mais próxima: ${guitarString.note} (${Math.round(guitarString.frequency)}Hz)`;
        }

        // Atualiza o indicador visual
        const needle = document.getElementById('tuner-needle');
        const status = document.getElementById('tuner-status');
        
        // Calcula a posição do indicador (cents varia de -50 a +50)
        const position = 50 + (noteInfo.cents);
        needle.style.left = `${Math.max(0, Math.min(100, position))}%`;
        
        // Atualiza o status baseado nos cents
        if (Math.abs(noteInfo.cents) <= this.tolerance) {
            status.textContent = 'Afinado! ✓';
            status.style.color = '#4CAF50';
        } else if (noteInfo.cents < 0) {
            status.textContent = 'Afrouxe a corda ↓';
            status.style.color = '#FFA726';
        } else {
            status.textContent = 'Aperte a corda ↑';
            status.style.color = '#FFA726';
        }
    }

    findFundamentalFrequency(buffer, sampleRate) {
        const bufferLength = this.analyser.frequencyBinCount;
        const frequencyArray = new Float32Array(bufferLength);
        this.analyser.getFloatFrequencyData(frequencyArray);

        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);

        if (rms < 0.01) {
            this.updateDebugInfo(`Volume muito baixo (RMS: ${rms.toFixed(4)})`);
            this.updateTunerDisplay(null);
            return -1;
        }

        let peakValue = -Infinity;
        let peakIndex = -1;
        
        const startIndex = Math.floor(this.minFrequency * bufferLength / sampleRate);
        const endIndex = Math.ceil(this.maxFrequency * bufferLength / sampleRate);

        for (let i = startIndex; i < endIndex; i++) {
            const value = frequencyArray[i];
            if (value > peakValue) {
                peakValue = value;
                peakIndex = i;
            }
        }

        if (peakValue < -60) {
            this.updateDebugInfo(`Sinal muito fraco: ${peakValue.toFixed(1)}dB`);
            this.updateTunerDisplay(null);
            return -1;
        }

        const fundamentalFreq = peakIndex * sampleRate / this.analyser.fftSize;
        const debugInfo = `Freq: ${fundamentalFreq.toFixed(1)}Hz, Amplitude: ${peakValue.toFixed(1)}dB, RMS: ${rms.toFixed(4)}`;
        
        if (fundamentalFreq >= this.minFrequency && fundamentalFreq <= this.maxFrequency) {
            this.updateDebugInfo(debugInfo + ' (OK)');
            return fundamentalFreq;
        } else {
            this.updateDebugInfo(debugInfo + ' (Fora do intervalo)');
            return -1;
        }
    }

    updatePitch() {
        if (!this.isRunning) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const timeBuffer = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(timeBuffer);
        
        const frequency = this.findFundamentalFrequency(timeBuffer, this.audioContext.sampleRate);
        this.updateTunerDisplay(frequency > 0 ? frequency : null);

        if (this.isRunning) {
            requestAnimationFrame(() => this.updatePitch());
        }
    }

    getNote(frequency) {
        if (!frequency || !isFinite(frequency) || frequency <= 0) {
            return '--';
        }

        // Ajustando a frequência para a oitava mais próxima das notas do violão
        while (frequency > 440) {
            frequency = frequency / 2;
        }
        while (frequency < 220) {
            frequency = frequency * 2;
        }

        const noteNum = 12 * (Math.log2(frequency / 440));
        const note = Math.round(noteNum) + 69;
        return this.noteStrings[note % 12];
    }

    debugAudioInput() {
        const debugElement = document.getElementById('tuner-debug');
        if (!debugElement) {
            const debugDiv = document.createElement('div');
            debugDiv.id = 'tuner-debug';
            debugDiv.style.fontSize = '12px';
            debugDiv.style.color = '#666';
            debugDiv.style.marginTop = '10px';
            document.querySelector('.tuner-display').appendChild(debugDiv);
        }
    }

    updateDebugInfo(info) {
        if (this.debugMode) {
            const debugElement = document.getElementById('tuner-debug');
            if (debugElement) {
                debugElement.textContent = info;
            }
        }
    }

    stop() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isRunning = false;
        const debugElement = document.getElementById('tuner-debug');
        if (debugElement) {
            debugElement.remove();
        }
    }
}; 