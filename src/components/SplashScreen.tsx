import { useEffect, useState } from "react";

export default function SplashScreen() {
  const text = "Расписание";
  const [visibleLetters, setVisibleLetters] = useState(0);

  useEffect(() => {
    const timers: number[] = [];

    text.split("").forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleLetters(index + 1);
        }, 250 + index * 130)
      );
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Marck+Script&display=swap');

        .splash-letter {
          display: inline-block;
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity 450ms ease-out,
            transform 550ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .splash-letter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          style={{
            fontFamily: "'Marck Script', cursive",
            fontSize: "clamp(48px, 14vw, 72px)",
            fontWeight: 400,
            color: "#0b9f78",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {text.split("").map((letter, index) => (
            <span
              key={index}
              className={`splash-letter ${
                index < visibleLetters ? "visible" : ""
              }`}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
