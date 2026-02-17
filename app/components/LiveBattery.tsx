"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AnimatedArrow from "./AnimatedArrow";

type BatteryStats = {
  watts?: number;
  soc?: number;
};

const randomInRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const createRandomStats = (): BatteryStats => {
  return {
    soc: Number(randomInRange(0, 100).toFixed(1)),
    watts: Number(randomInRange(-500, 2000).toFixed(1)),
  };
};

export default function LiveBattery() {
  const [stats, setStats] = useState<BatteryStats | null>(null);
  const [debugRandomMode, setDebugRandomMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedDebugMode = window.localStorage.getItem("debugRandomMode");
    if (savedDebugMode === "1") {
      setDebugRandomMode(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("debugRandomMode", debugRandomMode ? "1" : "0");
  }, [debugRandomMode]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const refresh = async () => {
      try {
        if (debugRandomMode) {
          if (!cancelled) {
            setStats(createRandomStats());
          }
        } else {
          const response = await fetch("https://batteryapi.liese.space/stats", {
            cache: "no-store",
          });
          const data = (await response.json()) as BatteryStats;
          if (!cancelled) {
            setStats(data);
          }
        }
      } catch {
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(refresh, 5000);
        }
      }
    };

    refresh();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [debugRandomMode]);

  const wattColor = useMemo(() => {
    if (!stats || !stats.watts) {
      return "var(--label-color)";
    }

    return stats.watts > 0 ? "var(--watt-positive-color)" : "var(--watt-negative-color)";
  }, [stats]);

  const wattText = useMemo(() => {
    if (!stats || typeof stats.watts !== "number") {
      return "...";
    }

    return `${Math.abs(stats.watts)} Watt`;
  }, [stats]);

  const soc = typeof stats?.soc === "number" ? stats.soc : 0;
  const watts = stats?.watts;

  return (
    <div className="liveRoot">
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", padding: "0.75rem 1rem 0" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem" }}>
          <input
            type="checkbox"
            checked={debugRandomMode}
            onChange={(event) => setDebugRandomMode(event.target.checked)}
          />
          Debug/Test random BatteryStats
        </label>
      </div>

      <div className="autoFill topCenter">
        {typeof watts === "number" && watts > 0 ? <AnimatedArrow /> : null}
        {(typeof watts !== "number" || watts === 0) && <div style={{ height: "80px" }} />}
        {typeof watts === "number" && watts < 0 ? (
          <div style={{ textAlign: "center" }}>
            <Image height={76} width={76} src="/assets/sun.gif" alt="Sun" unoptimized />
          </div>
        ) : null}
        <div className="label" style={{ color: wattColor }}>
          {wattText}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="knobRow">
          <div className="knob" />
          <div className="autoFill" />
          <div className="knob" />
        </div>
        <div className="battery">
          <div className="stackParent height100">
            <div className="stackChild">
              <div className="fillColumn">
                <div className="filling" style={{ height: `${soc}%` }} />
              </div>
            </div>
            <div className="stackChild">
              <div className="centerColumn">
                <div className="label batteryLabel">{typeof stats?.soc === "number" ? `${stats.soc} %` : ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="autoFill bottomCenter">
        <Link href="/history">Show history</Link>
      </div>
    </div>
  );
}
