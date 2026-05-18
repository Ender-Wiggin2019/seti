import { useEffect, useState } from 'react';

function readQueryParam<T>(name: string, parse: (value: string | null) => T): T {
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
