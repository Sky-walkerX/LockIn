"use client";

import { useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import { ChevronDown, Play, Volume2, VolumeX } from "lucide-react";
import { SETTLE } from "@/lib/motion";
import s from "./landing.module.css";

// The first thing a visitor sees: the launch film, laid on the desk like a
// sheet. It plays muted (browsers won't start a film with sound) and loops; the
// plate under it turns the sound on. It stops while it's scrolled out of view,
// so it isn't decoding off screen. With reduced motion it waits to be played.
export function FilmHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  // Whether it should be playing: off until the visitor's preferences are
  // known, and off once they pause it themselves.
  const wanted = useRef(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    wanted.current = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (wanted.current) v.play().catch(() => {});
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) v.pause();
        else if (wanted.current) v.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    seen.observe(v);
    return () => seen.disconnect();
  }, []);

  const play = () => {
    wanted.current = true;
    video.current?.play().catch(() => {});
  };
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) play();
  };

  return (
    <section className={`lk-cloth ${s.film}`} aria-label="The LockIn film">
      <m.div
        className={s.screen}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: SETTLE }}
      >
        <video
          ref={video}
          className={s.video}
          poster="/media/lockin-film-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={() => (playing ? (wanted.current = false, video.current?.pause()) : play())}
          aria-label="LockIn in 45 seconds: an agent saves a note to the Project-X section, you witness it, and another agent picks it up later."
        >
          <source src="/media/lockin-film-720.mp4" type="video/mp4" media="(max-width: 900px)" />
          <source src="/media/lockin-film-1080.mp4" type="video/mp4" />
        </video>
        {!playing && (
          <button type="button" className={s.playBtn} onClick={play} aria-label="Play the film">
            <Play aria-hidden />
          </button>
        )}
      </m.div>

      <m.div
        className={s.filmBar}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: SETTLE, delay: 0.5 }}
      >
        <button type="button" className={s.plateBtn} onClick={toggleSound} aria-pressed={!muted}>
          {muted ? <VolumeX className={s.icon} aria-hidden /> : <Volume2 className={s.icon} aria-hidden />}
          {muted ? "Sound on" : "Sound off"}
        </button>
        <a className={s.scrollCue} href="#notebook">
          See how it works
          <ChevronDown className={s.icon} aria-hidden />
        </a>
      </m.div>
    </section>
  );
}
