import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const text = "Расписание";

  useEffect(() => {
    const timers: number[] = [];

    for (let i = 0; i <= text.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setVisibleLetters(i);
        }, 120 + i * 70)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center">
        {text.split("").map((letter, index) => (
          <span
            key={index}
            className="text-[#0f9f78] font-semibold tracking-[-0.04em]"
            style={{
              fontSize: "clamp(36px, 10vw, 52px)",
              lineHeight: 1,
              opacity: index < visibleLetters ? 1 : 0,
              transform:
                index < visibleLetters
                  ? "translateY(0)"
                  : "translateY(5px)",
              transition:
                "opacity 280ms ease-out, transform 280ms ease-out",
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
