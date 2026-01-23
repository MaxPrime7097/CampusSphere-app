import React, { useEffect, useState } from "react";

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const launchDate = new Date("2026-02-11T19:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center pt-2">
      <h1 className="text-3xl font-bold font-raleway text-primary mb-4">🚀 CampusSphere arrive dans :</h1>
      <div className="flex gap-4 text-2xl font-semibold font-automata">
        {["Jours", "Heures", "Minutes", "Secondes"].map((label, i) => (
          <div key={label} className="bg-transparent p-2 rounded-xl h-20 campus-glow min-w-[80px]">
            <div>
              {Object.values(timeLeft)[i].toString().padStart(2, "0")}
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
