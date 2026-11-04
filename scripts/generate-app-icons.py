"""Generate all Habit Runner app icons from the promise mark: an open arc around a central anchor."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
APP = ROOT / "app"
RED = "#DC2626"
BLACK = "#000000"
SUPERSAMPLE = 8
VERSION = "20261104"
ARC_SWEEP = 300
ARC_OUTER_RATIO = 0.336
ARC_STROKE_RATIO = 0.086
ANCHOR_RATIO = 0.078


def render_icon(size: int, rounded: bool) -> Image.Image:
    canvas_size = size * SUPERSAMPLE
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    if rounded:
        radius = round(canvas_size * 0.219)
        draw.rounded_rectangle(
            (0, 0, canvas_size - 1, canvas_size - 1),
            radius=radius,
            fill=BLACK,
        )
    else:
        draw.rectangle((0, 0, canvas_size - 1, canvas_size - 1), fill=BLACK)

    center = canvas_size / 2
    outer = canvas_size * ARC_OUTER_RATIO
    stroke = max(SUPERSAMPLE, round(canvas_size * ARC_STROKE_RATIO))
    draw.arc(
        (center - outer, center - outer, center + outer, center + outer),
        start=0,
        end=ARC_SWEEP,
        fill=RED,
        width=stroke,
    )

    anchor = canvas_size * ANCHOR_RATIO
    draw.ellipse(
        (center - anchor, center - anchor, center + anchor, center + anchor),
        fill=RED,
    )

    return image.resize((size, size), Image.Resampling.LANCZOS)


def save_png(directory: Path, name: str, size: int, rounded: bool) -> None:
    render_icon(size, rounded).save(directory / name, optimize=True)


def main() -> None:
    # Keep Next.js conventional app icons aligned with the explicitly versioned
    # public assets referenced by metadata and the web manifest.
    save_png(APP, "icon.png", 512, rounded=True)
    save_png(APP, "apple-icon.png", 180, rounded=False)

    for name, size, rounded in (
        (f"favicon-promise-16-{VERSION}.png", 16, True),
        (f"favicon-promise-32-{VERSION}.png", 32, True),
        (f"apple-touch-promise-{VERSION}.png", 180, False),
        (f"pwa-promise-192-{VERSION}.png", 192, False),
        (f"pwa-promise-512-{VERSION}.png", 512, False),
        (f"mstile-promise-150-{VERSION}.png", 150, False),
    ):
        save_png(PUBLIC, name, size, rounded)

    ico_source = render_icon(256, rounded=True)
    ico_source.save(
        PUBLIC / f"favicon-promise-{VERSION}.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    main()
