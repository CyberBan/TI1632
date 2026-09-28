import { useEffect, useState } from "react";

const TEXT = "Расписание";

export default function SplashScreen() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers: number[] = [];

    TEXT.split("").forEach((_, index) => {
      const timer = window.setTimeout(() => {
        setVisibleCount(index + 1);
      }, 150 + index * 120);

      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <style>{`
        @font-face {
          font-family: "Amiak NHZDN";
          src: url("/fonts/amiak-nhzdn.ttf") format("truetype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        .splash-letter {
          display: inline-block;
          opacity: 0;
          transform: translateX(-10px);
          clip-path: inset(0 100% 0 0);

          transition:
            opacity 260ms ease-out,
            transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
            clip-path 500ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .splash-letter.visible {
          opacity: 1;
          transform: translateX(0);
          clip-path: inset(0 0 0 0);
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
            fontFamily: '"Amiak NHZDN", sans-serif',
            fontSize: "clamp(42px, 12vw, 68px)",
            fontWeight: 400,
            color: "#0A9F78",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {TEXT.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={`splash-letter ${
                index < visibleCount ? "visible" : ""
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
