"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/* ── types ───────────────────────────────────────── */

type BatteryStats = {
  watts?: number;
  soc?: number;
};

/* ── helpers ─────────────────────────────────────── */

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const createRandomStats = (): BatteryStats => ({
  soc: Number(randomInRange(0, 100).toFixed(1)),
  watts: Number(randomInRange(-500, 2000).toFixed(1)),
});

const getSocColor = (soc: number): string => {
  if (soc <= 10) return "#ef4444";
  if (soc <= 25) return "#f97316";
  if (soc <= 45) return "#eab308";
  if (soc <= 70) return "#84cc16";
  return "#22c55e";
};

const getSocGlow = (soc: number): string => {
  if (soc <= 10) return "rgba(239,68,68,0.35)";
  if (soc <= 25) return "rgba(249,115,22,0.3)";
  if (soc <= 45) return "rgba(234,179,8,0.25)";
  if (soc <= 70) return "rgba(132,204,22,0.25)";
  return "rgba(34,197,94,0.3)";
};

/* ── SVG layout constants ────────────────────────── */

const VB_W = 400;
const VB_H = 340;

// Battery body — wide LiFePO4 block
const B_X = 60;
const B_Y = 175;
const B_W = 280;
const B_H = 140;
const B_R = 10;

// Two terminal posts on top
const POST_W = 22;
const POST_H = 18;
const POST_R = 4;
const POST_L_X = B_X + 52 - POST_W / 2;   // left post
const POST_R_X = B_X + B_W - 52 - POST_W / 2; // right post
const POST_Y = B_Y - POST_H + 4;

// Fill area (inset from body)
const INSET = 5;
const F_X = B_X + INSET;
const F_W = B_W - INSET * 2;
const F_Y = B_Y + INSET;
const F_H = B_H - INSET * 2;
const F_R = B_R - INSET;

// Cable paths — from each terminal post up to connector endpoint
const L_CX = POST_L_X + POST_W / 2; // left post center X
const R_CX = POST_R_X + POST_W / 2; // right post center X
const LEFT_CABLE = `M ${L_CX} ${POST_Y} C ${L_CX} ${POST_Y - 70}, 36 ${POST_Y - 80}, 36 25`;
const RIGHT_CABLE = `M ${R_CX} ${POST_Y} C ${R_CX} ${POST_Y - 70}, ${VB_W - 36} ${POST_Y - 80}, ${VB_W - 36} 25`;

// Particles
const NUM_PARTICLES = 4;
const PARTICLE_DUR = 1.6;

/* ── component ───────────────────────────────────── */

export default function LiveBattery() {
  const [stats, setStats] = useState<BatteryStats | null>(null);
  const [debugRandomMode, setDebugRandomMode] = useState(false);

  /* persisted debug flag */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("debugRandomMode") === "1") {
      setDebugRandomMode(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("debugRandomMode", debugRandomMode ? "1" : "0");
  }, [debugRandomMode]);

  /* data polling */
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const refresh = async () => {
      try {
        if (debugRandomMode) {
          if (!cancelled) setStats(createRandomStats());
        } else {
          const r = await fetch("https://batteryapi.liese.space/stats", {
            cache: "no-store",
          });
          const d = (await r.json()) as BatteryStats;
          if (!cancelled) setStats(d);
        }
      } catch {
        /* swallow */
      } finally {
        if (!cancelled) tid = setTimeout(refresh, 5000);
      }
    };

    refresh();

    return () => {
      cancelled = true;
      if (tid) clearTimeout(tid);
    };
  }, [debugRandomMode]);

  /* ── derived values ────────────────────────────── */

  const soc = typeof stats?.soc === "number" ? stats.soc : 0;
  const watts = stats?.watts;
  const isCharging = typeof watts === "number" && watts < 0;
  const isDischarging = typeof watts === "number" && watts > 0;

  const fillColor = getSocColor(soc);
  const glowColor = getSocGlow(soc);
  const fillHeight = F_H * (soc / 100);
  const fillY = F_Y + F_H - fillHeight;

  const wattText =
    typeof watts === "number" ? `${Math.abs(watts).toLocaleString()} W` : "—";
  const statusText = isCharging
    ? "CHARGING"
    : isDischarging
      ? "DISCHARGING"
      : typeof watts === "number"
        ? "IDLE"
        : "";
  const statusColor = isCharging
    ? "#4ade80"
    : isDischarging
      ? "#f87171"
      : "#64748b";
  const particleColor = isCharging ? "#4ade80" : "#f87171";

  const ticks = [25, 50, 75].map((pct) => ({
    pct,
    y: F_Y + F_H - F_H * (pct / 100),
  }));

  return (
    <div className="live-root">
      {/* ── Debug toggle ─────────────────────────── */}
      <div className="live-debug-bar">
        <label className="live-debug-toggle">
          <input
            type="checkbox"
            checked={debugRandomMode}
            onChange={(e) => setDebugRandomMode(e.target.checked)}
          />
          <span>Debug / Test</span>
        </label>
      </div>

      {/* ── Ambient glow ─────────────────────────── */}
      <div
        className="battery-ambient"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* ── Sun icon when charging ──────────────── */}
      {isCharging && (
        <div className="sun-icon">
          <Image height={86} width={86} src="/assets/sun.gif" alt="Solar charging" unoptimized />
        </div>
      )}

      {/* ── Battery SVG ──────────────────────────── */}
      <div className="battery-canvas">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="battery-svg">
          <defs>
            {/* Filters */}
            <filter id="glowSm" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowLg" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="6"
                floodColor="#000"
                floodOpacity="0.5"
              />
            </filter>
            <filter id="textSh" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="2"
                floodColor="#000"
                floodOpacity="0.9"
              />
            </filter>

            {/* Gradients */}
            <linearGradient id="bodyMetal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2a2a2e" />
              <stop offset="20%" stopColor="#3d3d42" />
              <stop offset="50%" stopColor="#48484e" />
              <stop offset="80%" stopColor="#3d3d42" />
              <stop offset="100%" stopColor="#2a2a2e" />
            </linearGradient>
            <linearGradient id="fillDepth" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
            </linearGradient>
            <linearGradient id="fillTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Clip path for fill */}
            <clipPath id="fillClip">
              <rect x={F_X} y={F_Y} width={F_W} height={F_H} rx={F_R} />
            </clipPath>

            {/* Cable path references */}
            <path id="cableL" d={LEFT_CABLE} />
            <path id="cableR" d={RIGHT_CABLE} />
          </defs>

          {/* ═══ CABLES ═══ */}

          {/* Active glow */}
          {(isCharging || isDischarging) && (
            <g opacity="0.2">
              <use
                href="#cableL"
                stroke={particleColor}
                strokeWidth="12"
                fill="none"
                filter="url(#glowLg)"
              />
              <use
                href="#cableR"
                stroke={particleColor}
                strokeWidth="12"
                fill="none"
                filter="url(#glowLg)"
              />
            </g>
          )}

          {/* Outer cable stroke */}
          <use
            href="#cableL"
            stroke="#3a3a3e"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <use
            href="#cableR"
            stroke="#3a3a3e"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          {/* Inner cable highlight */}
          <use
            href="#cableL"
            stroke="#505054"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <use
            href="#cableR"
            stroke="#505054"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* End connectors */}
          <circle cx="36" cy="25" r="8" fill="#3a3a3e" stroke="#555" strokeWidth="1.5" />
          <circle cx={VB_W - 36} cy="25" r="8" fill="#3a3a3e" stroke="#555" strokeWidth="1.5" />
          <circle cx="36" cy="25" r="3.5" fill="#666" />
          <circle cx={VB_W - 36} cy="25" r="3.5" fill="#666" />

          {/* ═══ PARTICLES ═══ */}
          {(isCharging || isDischarging) &&
            Array.from({ length: NUM_PARTICLES }).map((_, i) => {
              const delay = `${i * (PARTICLE_DUR / NUM_PARTICLES)}s`;
              const kp = isDischarging ? "0;1" : "1;0";
              return (
                <g key={i}>
                  {/* Left cable */}
                  <circle
                    r="7"
                    fill={particleColor}
                    opacity="0.2"
                    filter="url(#glowSm)"
                  >
                    <animateMotion
                      dur={`${PARTICLE_DUR}s`}
                      repeatCount="indefinite"
                      begin={delay}
                      keyPoints={kp}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href="#cableL" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill={particleColor} opacity="0.95">
                    <animateMotion
                      dur={`${PARTICLE_DUR}s`}
                      repeatCount="indefinite"
                      begin={delay}
                      keyPoints={kp}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href="#cableL" />
                    </animateMotion>
                  </circle>

                  {/* Right cable */}
                  <circle
                    r="7"
                    fill={particleColor}
                    opacity="0.2"
                    filter="url(#glowSm)"
                  >
                    <animateMotion
                      dur={`${PARTICLE_DUR}s`}
                      repeatCount="indefinite"
                      begin={delay}
                      keyPoints={kp}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href="#cableR" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill={particleColor} opacity="0.95">
                    <animateMotion
                      dur={`${PARTICLE_DUR}s`}
                      repeatCount="indefinite"
                      begin={delay}
                      keyPoints={kp}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href="#cableR" />
                    </animateMotion>
                  </circle>
                </g>
              );
            })}

          {/* ═══ BATTERY BODY ═══ */}

          <g filter="url(#shadow)">
            {/* Left terminal post */}
            <rect
              x={POST_L_X}
              y={POST_Y}
              width={POST_W}
              height={POST_H}
              rx={POST_R}
              fill="url(#bodyMetal)"
              stroke="#555"
              strokeWidth="1.5"
            />
            {/* Right terminal post */}
            <rect
              x={POST_R_X}
              y={POST_Y}
              width={POST_W}
              height={POST_H}
              rx={POST_R}
              fill="url(#bodyMetal)"
              stroke="#555"
              strokeWidth="1.5"
            />
            {/* Main body */}
            <rect
              x={B_X}
              y={B_Y}
              width={B_W}
              height={B_H}
              rx={B_R}
              fill="url(#bodyMetal)"
              stroke="#555"
              strokeWidth="2"
            />
          </g>

          {/* Terminal bolt details */}
          <circle cx={L_CX} cy={POST_Y + POST_H / 2 - 1} r="5.5" fill="#2a2a2e" stroke="#555" strokeWidth="1" />
          <circle cx={L_CX} cy={POST_Y + POST_H / 2 - 1} r="2.5" fill="#606068" />
          <circle cx={R_CX} cy={POST_Y + POST_H / 2 - 1} r="5.5" fill="#2a2a2e" stroke="#555" strokeWidth="1" />
          <circle cx={R_CX} cy={POST_Y + POST_H / 2 - 1} r="2.5" fill="#606068" />

          {/* +/- labels on posts */}
          <text x={L_CX} y={POST_Y - 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444" opacity="0.7">−</text>
          <text x={R_CX} y={POST_Y - 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4ade80" opacity="0.7">+</text>

          {/* Top edge bevel line */}
          <line x1={B_X + B_R} y1={B_Y + 3} x2={B_X + B_W - B_R} y2={B_Y + 3} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Inner dark well */}
          <rect
            x={F_X}
            y={F_Y}
            width={F_W}
            height={F_H}
            rx={F_R}
            fill="#141418"
          />

          {/* Fill glow (behind fill) */}
          {soc > 0 && (
            <rect
              x={F_X}
              y={fillY}
              width={F_W}
              height={fillHeight}
              clipPath="url(#fillClip)"
              fill={glowColor}
              filter="url(#glowLg)"
            />
          )}

          {/* Fill bar */}
          {soc > 0 && (
            <rect
              x={F_X}
              y={fillY}
              width={F_W}
              height={fillHeight}
              clipPath="url(#fillClip)"
              fill={fillColor}
              className={soc <= 10 ? "battery-critical" : ""}
            />
          )}

          {/* Fill depth overlay */}
          {soc > 0 && (
            <rect
              x={F_X}
              y={fillY}
              width={F_W}
              height={fillHeight}
              clipPath="url(#fillClip)"
              fill="url(#fillDepth)"
            />
          )}

          {/* Fill meniscus shine */}
          {soc > 0 && soc < 98 && (
            <rect
              x={F_X}
              y={fillY}
              width={F_W}
              height={Math.min(12, fillHeight)}
              clipPath="url(#fillClip)"
              fill="url(#fillTop)"
            />
          )}

          {/* Tick marks at 25 / 50 / 75 % */}
          {ticks.map((t) => (
            <line
              key={t.pct}
              x1={F_X}
              y1={t.y}
              x2={F_X + F_W}
              y2={t.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
              strokeDasharray="4,5"
            />
          ))}

          {/* Inner rim highlight */}
          <rect
            x={B_X + 1}
            y={B_Y + 1}
            width={B_W - 2}
            height={B_H - 2}
            rx={B_R - 1}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />

          {/* SoC percentage */}
          <text
            x={B_X + B_W / 2}
            y={B_Y + B_H / 2 + 12}
            textAnchor="middle"
            fontSize="36"
            fontWeight="bold"
            fontFamily="'SF Mono','Fira Code','Cascadia Code','Consolas',monospace"
            fill="white"
            filter="url(#textSh)"
          >
            {typeof stats?.soc === "number" ? `${stats.soc}%` : "—"}
          </text>
        </svg>
      </div>

      {/* ── Power info ───────────────────────────── */}
      <div className="power-info">
        <div className="power-watts" style={{ color: statusColor }}>
          {wattText}
        </div>
        {statusText && (
          <div className="power-status" style={{ color: statusColor }}>
            {statusText}
          </div>
        )}
      </div>

      {/* ── History link ─────────────────────────── */}
      <div className="live-footer">
        <Link href="/history" className="history-link">
          Show History
        </Link>
      </div>
    </div>
  );
}
