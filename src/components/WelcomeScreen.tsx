import { useState, useEffect } from "react";

const ASCII_ART = `
 __        __   _
 \\ \\      / /__| | ___ ___  _ __ ___   ___
  \\ \\ /\\ / / _ \\ |/ __/ _ \\| '_ \` _ \\ / _ \\
   \\ V  V /  __/ | (_| (_) | | | | | |  __/
    \\_/\\_/ \\___|_|\\___\\___/|_| |_| |_|\\___|
`.trimStart();

export function WelcomeScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase("fading"), 1500);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (phase !== "fading") return;
    const fadeTimer = setTimeout(() => setPhase("gone"), 600);
    return () => clearTimeout(fadeTimer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`welcome-screen ${phase === "fading" ? "welcome-screen--fading" : ""}`}>
      <pre className="welcome-screen__art">{ASCII_ART}</pre>
    </div>
  );
}
