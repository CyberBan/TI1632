import { useEffect, useState } from "react";

const TEXT = "Расписание";

export default function SplashScreen() {
  const [visibleLetters, setVisibleLetters] = useState(0);

  useEffect(() => {
    const timers: number[] = [];

    TEXT.split("").forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleLetters(index + 1);
        }, 180 + index * 110)
      );
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Название */}
      <div
        className="flex"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "clamp(44px, 13vw, 68px)",
          fontWeight: 700,
          color: "#0a9f78",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {TEXT.split("").map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            style={{
              display: "inline-block",
              opacity: index < visibleLetters ? 1 : 0,
              transform:
                index < visibleLetters
                  ? "translateY(0)"
                  : "translateY(8px)",
              transition:
                "opacity 300ms ease-out, transform 400ms ease-out",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Автор */}
      <div
        style={{
          marginTop: "18px",
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "15px",
          color: "#a3a3a3",
          letterSpacing: "0.02em",
          opacity: visibleLetters === TEXT.length ? 1 : 0,
          transform:
            visibleLetters === TEXT.length
              ? "translateY(0)"
              : "translateY(5px)",
          transition:
            "opacity 500ms ease-out, transform 500ms ease-out",
        }}
      >
        by @vlasssssssssss
      </div>
    </div>
  );
}
