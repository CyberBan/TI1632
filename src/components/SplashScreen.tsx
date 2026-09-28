import React from "react";

const letters = ["а", "с", "п", "и", "с", "а", "н", "и", "е"];

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 99999;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 45%, #202020 0%, #111 35%, #080808 75%, #050505 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "SF Pro Text", Inter, sans-serif;
          animation: splashFadeOut 0.55s ease forwards;
          animation-delay: 2.65s;
          pointer-events: all;
        }

        .splash-screen::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(255,255,255,0.055);
          filter: blur(50px);
          animation: pulseGlow 2.2s ease-in-out infinite;
        }

        .splash-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .splash-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.65);
          box-shadow: 0 0 10px rgba(255,255,255,0.7);
          opacity: 0;
          animation: particleFloat 2.2s ease-out forwards;
        }

        .splash-particle:nth-child(1) {
          left: 18%;
          top: 32%;
          animation-delay: .15s;
        }

        .splash-particle:nth-child(2) {
          left: 78%;
          top: 27%;
          animation-delay: .35s;
        }

        .splash-particle:nth-child(3) {
          left: 84%;
          top: 65%;
          animation-delay: .5s;
        }

        .splash-particle:nth-child(4) {
          left: 12%;
          top: 68%;
          animation-delay: .7s;
        }

        .splash-particle:nth-child(5) {
          left: 27%;
          top: 76%;
          animation-delay: .9s;
        }

        .splash-particle:nth-child(6) {
          left: 72%;
          top: 78%;
          animation-delay: .25s;
        }

        .splash-particle:nth-child(7) {
          left: 50%;
          top: 17%;
          animation-delay: .6s;
        }

        .splash-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 90px;
          padding: 0 24px;
        }

        .splash-word {
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          font-size: clamp(42px, 13vw, 72px);
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.055em;
          text-shadow:
            0 0 18px rgba(255,255,255,0.08),
            0 0 45px rgba(255,255,255,0.05);
        }

        .splash-r {
          display: inline-block;
          opacity: 0;
          transform: translateX(-180px) translateY(30px) rotate(-28deg) scale(.55);
          animation:
            letterFlyIn .72s cubic-bezier(.16,1.3,.3,1) forwards,
            letterGlow .8s ease-out forwards;
          animation-delay: .08s, .65s;
        }

        .splash-letter {
          display: inline-block;
          opacity: 0;
          transform: translateY(18px) scale(.75);
          animation: letterAppear .34s cubic-bezier(.2,.9,.3,1.2) forwards;
        }

        .splash-letter:nth-child(2) { animation-delay: .76s; }
        .splash-letter:nth-child(3) { animation-delay: .84s; }
        .splash-letter:nth-child(4) { animation-delay: .92s; }
        .splash-letter:nth-child(5) { animation-delay: 1.00s; }
        .splash-letter:nth-child(6) { animation-delay: 1.08s; }
        .splash-letter:nth-child(7) { animation-delay: 1.16s; }
        .splash-letter:nth-child(8) { animation-delay: 1.24s; }
        .splash-letter:nth-child(9) { animation-delay: 1.32s; }
        .splash-letter:nth-child(10) { animation-delay: 1.40s; }

        .splash-line {
          position: absolute;
          left: 50%;
          bottom: -22px;
          height: 2px;
          width: 0;
          transform: translateX(-50%);
          background: white;
          border-radius: 999px;
          box-shadow:
            0 0 8px rgba(255,255,255,.8),
            0 0 22px rgba(255,255,255,.35);
          animation: lineGrow .7s cubic-bezier(.2,.8,.2,1) 1.35s forwards;
        }

        .splash-subtitle {
          position: absolute;
          top: calc(50% + 70px);
          left: 0;
          right: 0;
          text-align: center;
          font-size: 11px;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(255,255,255,.32);
          opacity: 0;
          animation: subtitleAppear .6s ease 1.45s forwards;
        }

        @keyframes letterFlyIn {
          0% {
            opacity: 0;
            transform: translateX(-180px) translateY(30px) rotate(-28deg) scale(.55);
          }
          65% {
            opacity: 1;
            transform: translateX(12px) translateY(-4px) rotate(4deg) scale(1.08);
          }
          82% {
            transform: translateX(-4px) translateY(2px) rotate(-1deg) scale(.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) rotate(0) scale(1);
          }
        }

        @keyframes letterGlow {
          0% {
            text-shadow:
              0 0 0 rgba(255,255,255,0),
              0 0 0 rgba(255,255,255,0);
          }
          45% {
            text-shadow:
              0 0 22px rgba(255,255,255,.95),
              0 0 65px rgba(255,255,255,.5);
          }
          100% {
            text-shadow:
              0 0 18px rgba(255,255,255,.08),
              0 0 45px rgba(255,255,255,.05);
          }
        }

        @keyframes letterAppear {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(.75);
            filter: blur(5px);
          }
          65% {
            opacity: 1;
            transform: translateY(-3px) scale(1.04);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes lineGrow {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 75%;
            opacity: .8;
          }
        }

        @keyframes subtitleAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes particleFloat {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(.4);
          }
          25% {
            opacity: .8;
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(1.4);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(.85);
            opacity: .45;
          }
          50% {
            transform: scale(1.15);
            opacity: .8;
          }
        }

        @keyframes splashFadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          70% {
            opacity: 1;
            transform: scale(1.015);
          }
          100% {
            opacity: 0;
            transform: scale(1.035);
            visibility: hidden;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-screen,
          .splash-r,
          .splash-letter,
          .splash-line,
          .splash-subtitle,
          .splash-particle {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }

          .splash-screen {
            display: none;
          }
        }
      `}</style>

      <div className="splash-particles">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="splash-particle" />
        ))}
      </div>

      <div className="splash-content">
        <div className="splash-word">
          <span className="splash-r">Р</span>

          {letters.map((letter, index) => (
            <span className="splash-letter" key={`${letter}-${index}`}>
              {letter}
            </span>
          ))}
        </div>

        <div className="splash-line" />
      </div>

      <div className="splash-subtitle">
        Группа 163
      </div>
    </div>
  );
}
