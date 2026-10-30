import * as Speech from 'expo-speech';

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, {
    language: 'es-ES',
    rate: 1,
    volume: 1,
    // iOS: let the system manage a separate audio session that ducks music
    // only while speaking, instead of keeping ours active (permanent ducking).
    useApplicationAudioSession: false,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
