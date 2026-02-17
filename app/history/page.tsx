"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HistoryPage() {
  const [hours, setHours] = useState(4);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches);
    };

    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  const url1 = useMemo(() => {
    const backgroundColor = isDarkMode ? "%23111111" : "%23ffffff";
    const chartColor = isDarkMode ? "%237ba2ff" : "%232020d6";
    return `https://thingspeak.com/channels/1465860/charts/1?bgcolor=${backgroundColor}&color=${chartColor}&dynamic=true&results=${hours * 20}&title=State+of+Charge+%5B%25%5D&type=line&yaxis=SoC&width=auto&height=auto`;
  }, [hours, isDarkMode]);

  const url2 = useMemo(() => {
    const backgroundColor = isDarkMode ? "%23111111" : "%23ffffff";
    const chartColor = isDarkMode ? "%23ff7a7a" : "%23d62020";
    return `https://thingspeak.com/channels/1465877/charts/1?bgcolor=${backgroundColor}&color=${chartColor}&dynamic=true&results=${hours * 20}&title=P+%5BW%5D&type=line&yaxis=Watt&width=auto&height=auto`;
  }, [hours, isDarkMode]);

  return (
    <div className="historyRoot">
      <div className="historyControls">
        <div>Hours:</div>
        <input
          className="width100"
          type="range"
          min={4}
          max={168}
          step={4}
          value={hours}
          onChange={(event) => setHours(Number(event.target.value))}
        />
        <div>{hours}</div>
      </div>

      <div className="historyCharts">
        <iframe className="historyIframe" src={url1} title="State of Charge" />
        <iframe className="historyIframe" src={url2} title="Power" />
      </div>

      <div style={{ margin: "0 1em 1em 1em" }}>
        <Link href="/">Back</Link>
      </div>
    </div>
  );
}
