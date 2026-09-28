import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

const TEXT = "Расписание";

export default function SplashScreen() {
  const [logoVisible, setLogoVisible] = useState(false);
  const [visibleLetters, setVisibleLetters] = useState(0);

  useEffect(() => {
    const logoTimer = window.setTimeout(() => {
      setLogoVisible(true);
    }, 100);

    const timers: number[] = [];

    TEXT.split("").forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleLetters(index + 1);
        }, 650 + index * 110)
      );
    });

    return () => {
      clearTimeout(logoTimer);
      timers.forEach(clearTimeout);
    };
  }, []);

  const finished = visibleLetters === TEXT.length;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Та самая иконка приложения */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "#0f9f78",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",

          opacity: logoVisible ? 1 : 0,
          transform: logoVisible
            ? "translateY(0) scale(1)"
            : "translateY(10px) scale(0.92)",

          transition:
            "opacity 500ms ease-out, transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <GraduationCap
          style={{
            width: "36px",
            height: "36px",
            color: "white",
            strokeWidth: 2,
          }}
        />
      </div>

      {/* Расписание */}
      <div
        style={{
          display: "flex",
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "clamp(44px, 13vw, 68px)",
          fontWeight: 700,
          color: "#0f9f78",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {TEXT.split("").map((letter, index) => (
          <span
            key={index}
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
          marginTop: "16px",
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "15px",
          color: "#a3a3a3",
          opacity: finished ? 1 : 0,
          transform: finished
            ? "translateY(0)"
            : "translateY(5px)",
          transition: "opacity 500ms ease-out, transform 500ms ease-out",
        }}
      >
        by @vlasssssssssss
      </div>
    </div>
  );
}
