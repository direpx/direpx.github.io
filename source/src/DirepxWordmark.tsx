"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";

export function DirepxWordmark() {
  const [isXActive, setIsXActive] = useState(false);

  const handlePointerEnter = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "touch") setIsXActive(true);
  };

  const handlePointerRelease = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch") setIsXActive(false);
  };

  return (
    <svg
      className={`wordmark${isXActive ? " is-x-active" : ""}`}
      viewBox="0 18 386 74"
      role="img"
      aria-label="DIREPX"
      tabIndex={0}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setIsXActive(false)}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") setIsXActive(true);
      }}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onBlur={() => setIsXActive(false)}
    >
      <g fill="#fff" fillRule="evenodd">
        <path d="M6 27h37l15 15v26L43 83H6V27Zm13 12v32h19l7-7V46l-7-7H19Z" />
        <path d="M73 27h13v56H73z" />
        <path d="M102 27h48l8 8v16l-8 8h-11l19 24h-16l-18-24h-9v24h-13V27Zm13 12v9h28l3-3v-3l-3-3h-28Z" />
        <path d="M169 27h52v12h-39v10h34v12h-34v10h39v12h-52V27Z" />
        <path d="M236 27h46l7 7v18l-7 7h-33v24h-13V27Zm13 12v9h27l2-2v-5l-2-2h-27Z" />
        <g className="wordmark-x">
          <path d="M334 24l15 15 15-15 16 16-15 15 15 15-15 15-16-15-15 15-16-16 15-15-15-14 16-16Zm3 20 3-3 22 22-3 3-22-22Z" />
        </g>
      </g>
    </svg>
  );
}
