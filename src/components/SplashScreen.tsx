import { useEffect, useState } from "react";

const TEXT = "Расписание";

export default function SplashScreen() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers: number[] = [];

    TEXT.split("").forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisible(index + 1);
        }, 180 + index * 170)
      );
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <>
      <style>{`
        @font-face {
          font-family: "Amiak NHZDN";
          src: url("/fonts/Amiak-NHZDN.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .splash-word {
          display: flex;
          white-space: nowrap;

          font-family: "Amiak NHZDN", sans-serif;
          font-size: clamp(48px, 14vw, 76px);
          color: #0a9f78;
          line-height: 1;
        }

        .splash-letter {
          display: inline-block;

          opacity: 0;
          clip-path: inset(0 100% 0 0);
          transform: translateX(-4px);

          transition:
            clip-path 700ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 180ms ease-out,
            transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .splash-letter.visible {
          opacity: 1;
          clip-path: inset(0 0 0 0);
          transform: translateX(0);
        }
      `}</style>

      <div className="splash">
        <div className="splash-word">
          {TEXT.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={`splash-letter ${
                index < visible ? "visible" : ""
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
