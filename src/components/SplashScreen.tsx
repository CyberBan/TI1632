import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="text-[#0f9f78]"
        style={{
          fontFamily:
            '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", sans-serif',
          fontSize: "clamp(42px, 12vw, 64px)",
          fontWeight: 700,
          letterSpacing: "-0.055em",
          transform: visible
            ? "scaleX(1) translateY(0)"
            : "scaleX(0.94) translateY(6px)",
          opacity: visible ? 1 : 0,
          transition:
            "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        Расписание
      </div>
    </div>
  );
}
