// Two soft rising tones, synthesised so there's no audio asset to ship. Browsers
// only allow audio after a user gesture on the page; pressing Start counts.
export function chime() {
  try {
    const ctx = new AudioContext();
    [
      { at: 0, freq: 660 },
      { at: 0.18, freq: 880 },
    ].forEach(({ at, freq }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + at;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // No audio available; the title and notification still announce it.
  }
}
