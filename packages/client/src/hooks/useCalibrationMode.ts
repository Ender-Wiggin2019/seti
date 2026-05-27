import { useEffect, useState } from 'react';

function readQueryParam<T>(
  name: string,
  parse: (value: string | null) => T,
): T {
  if (typeof window === 'undefined') return parse(null);
  const params = new URLSearchParams(window.location.search);
  return parse(params.get(name));
}

function useQueryParam<T>(name: string, parse: (value: string | null) => T): T {
  const [value, setValue] = useState(() => readQueryParam(name, parse));
  useEffect(() => {
    const update = (): void => {
      setValue(readQueryParam(name, parse));
    };
    window.addEventListener('popstate', update);
    return (): void => {
      window.removeEventListener('popstate', update);
    };
  }, [name, parse]);
  return value;
}

const parseCalibrationFlag = (raw: string | null): boolean =>
  raw === '1' || raw === 'true';

const parsePreviewOverflowCount = (raw: string | null): number => {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Read the `?calibrate=1` URL flag.
 *
 * When enabled, alien-board art renderers replace the live player markers with
 * numbered calibration rings at every layout slot. Used to verify that the
 * `xPct` / `yPctBottomToTop` percentages line up with the printed circles on
 * the alien-board art.
 */
export function useCalibrationMode(): boolean {
  return useQueryParam('calibrate', parseCalibrationFlag);
}

/**
 * Read the `?previewOverflow=N` URL flag.
 *
 * When > 0, art renderers can synthesize that many additional fake occupants
 * in the overflow zone (in addition to the 4 single-cap occupants), purely for
 * visual verification of the stack rendering. Has no effect on game state.
 */
export function usePreviewOverflowCount(): number {
  return useQueryParam('previewOverflow', parsePreviewOverflowCount);
}

export interface IOumuamuaCalibration {
  /** Visual rotation override (deg) on top of the tile's natural orient angle. */
  rotationOffset: number;
  /** Linear scale of the planet image vs. its computed cell-fit size. */
  scale: number;
  /** Pixel offset along the tangential axis (positive = clockwise). */
  offsetT: number;
  /** Pixel offset along the radial axis (positive = outward). */
  offsetR: number;
}

const parseFloatOrDefault = (raw: string | null, fallback: number): number => {
  if (raw === null) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * URL-driven knobs for tuning the Oumuamua planet art over the printed
 * wheel. Defaults are placeholders chosen for the slot-5 position; iterate
 * via `?oumRot=…&oumScale=…&oumT=…&oumR=…` until the notch wedges in
 * cleanly, then bake into the constants in `SolarSystemView.tsx`.
 */
export function useOumuamuaCalibration(): IOumuamuaCalibration {
  const rotationOffset = useQueryParam('oumRot', (raw) =>
    parseFloatOrDefault(raw, 0),
  );
  const scale = useQueryParam('oumScale', (raw) => parseFloatOrDefault(raw, 1));
  const offsetT = useQueryParam('oumT', (raw) => parseFloatOrDefault(raw, 0));
  const offsetR = useQueryParam('oumR', (raw) => parseFloatOrDefault(raw, 0));
  return { rotationOffset, scale, offsetT, offsetR };
}

export interface IOumuamuaDataPillCalibration {
  /** Pixel offset along the tangential axis (positive = clockwise). */
  offsetT: number;
  /** Pixel offset along the radial axis (positive = outward). */
  offsetR: number;
  /** Rotation override (deg) for the pill itself, on top of the tile angle. */
  rotation: number;
}

/**
 * URL-driven knobs for tuning the 3-data pill independently of the planet
 * art. Iterate with `?oumDotT=…&oumDotR=…&oumDotRot=…` then bake into
 * `OUMUAMUA_DATA_PILL_BASE_OFFSET` in `SolarSystemView.tsx`.
 */
export function useOumuamuaDataPillCalibration(): IOumuamuaDataPillCalibration {
  const offsetT = useQueryParam('oumDotT', (raw) =>
    parseFloatOrDefault(raw, 0),
  );
  const offsetR = useQueryParam('oumDotR', (raw) =>
    parseFloatOrDefault(raw, 0),
  );
  const rotation = useQueryParam('oumDotRot', (raw) =>
    parseFloatOrDefault(raw, 0),
  );
  return { offsetT, offsetR, rotation };
}
