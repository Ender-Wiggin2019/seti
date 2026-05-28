#!/usr/bin/env python3
"""Normalize refined alien board images into client WebP assets."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError as exc:  # pragma: no cover - environment guard
    raise SystemExit(
        "Pillow is required. Install it with `python3 -m pip install Pillow`."
    ) from exc


REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = REPO_ROOT / "packages/client/public/assets/seti/refine/aliens"
TARGET_DIR = REPO_ROOT / "packages/client/public/assets/seti/aliens"
TARGET_SIZE = (777, 1415)
WEBP_QUALITY = 95

MAPPINGS = {
    "back.png": Path("back.webp"),
    "anomalies.png": Path("anomalies/board.webp"),
    "centaurians.png": Path("centaurians/board.webp"),
    "exertians.png": Path("exertians/board.webp"),
    "mascamites.png": Path("mascamites/board.webp"),
    "oumuamua.png": Path("oumuamua/board.webp"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Normalize packages/client/public/assets/seti/refine/aliens PNG files "
            "into existing alien board WebP filenames."
        )
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=SOURCE_DIR,
        help="Directory containing refined alien PNG images.",
    )
    parser.add_argument(
        "--target-dir",
        type=Path,
        default=TARGET_DIR,
        help="Directory containing client alien image assets.",
    )
    parser.add_argument(
        "--target-size",
        default=f"{TARGET_SIZE[0]}x{TARGET_SIZE[1]}",
        help="Output size as WIDTHxHEIGHT. Defaults to current client board art size.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report source sizes and planned outputs without writing files.",
    )
    return parser.parse_args()


def parse_size(value: str) -> tuple[int, int]:
    width_text, separator, height_text = value.lower().partition("x")
    if separator != "x":
        raise argparse.ArgumentTypeError("target size must use WIDTHxHEIGHT format")
    try:
        width = int(width_text)
        height = int(height_text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("target size must contain integers") from exc
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("target size must be positive")
    return width, height


def collect_source_sizes(source_dir: Path) -> dict[str, tuple[int, int]]:
    sizes: dict[str, tuple[int, int]] = {}
    for source_name in MAPPINGS:
        source_path = source_dir / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"Missing source image: {source_path}")
        with Image.open(source_path) as image:
            sizes[source_name] = image.size
    return sizes


def save_webp(source_path: Path, target_path: Path, size: tuple[int, int]) -> None:
    with Image.open(source_path) as image:
        normalized = ImageOps.fit(
            image.convert("RGB"),
            size,
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        target_path.parent.mkdir(parents=True, exist_ok=True)
        normalized.save(
            target_path,
            "WEBP",
            quality=WEBP_QUALITY,
            method=6,
        )


def main() -> None:
    args = parse_args()
    target_size = parse_size(args.target_size)

    source_sizes = collect_source_sizes(args.source_dir)
    unique_sizes = sorted(set(source_sizes.values()))
    size_summary = ", ".join(f"{width}x{height}" for width, height in unique_sizes)
    print(f"Source dimensions: {size_summary}")
    if len(unique_sizes) == 1:
        print("Source dimensions are consistent.")
    else:
        print("Source dimensions differ; each image will be center-cropped to target size.")

    print(f"Target dimensions: {target_size[0]}x{target_size[1]}")
    for source_name, relative_target in MAPPINGS.items():
        source_path = args.source_dir / source_name
        target_path = args.target_dir / relative_target
        action = "would write" if args.dry_run else "writing"
        print(f"{source_path.relative_to(REPO_ROOT)} -> {target_path.relative_to(REPO_ROOT)} ({action})")
        if not args.dry_run:
            save_webp(source_path, target_path, target_size)


if __name__ == "__main__":
    main()
