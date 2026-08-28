"""Generate all Habit Runner app icons from the canonical red target mark."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
APP = ROOT / "app"
RED = "#DC2626"
WHITE = "#FFFFFF"
SUPERSAMPLE = 8
VERSION = "20260828"


def render_icon(size: int, rounded: bool) -> Image.Image:
    canvas_size = size * SUPERSAMPLE
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    if rounded:
        radius = round(canvas_size * 0.219)
        draw.rounded_rectangle(
            (0, 0, canvas_size - 1, canvas_size - 1),
            radius=radius,
            fill=RED,
        )
    else:
        draw.rectangle((0, 0, canvas_size - 1, canvas_size - 1), fill=RED)

    center = canvas_size / 2
    stroke = max(SUPERSAMPLE, round(canvas_size * 0.078))
    for radius_ratio in (0.328, 0.191):
        radius = canvas_size * radius_ratio
        draw.ellipse(
            (
                center - radius,
                center - radius,
                center + radius,
                center + radius,
            ),
            outline=WHITE,
            width=stroke,
        )

    center_radius = canvas_size * 0.055
    draw.ellipse(
        (
            center - center_radius,
            center - center_radius,
            center + center_radius,
            center + center_radius,
        ),
        fill=WHITE,
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
        (f"favicon-target-16-{VERSION}.png", 16, True),
        (f"favicon-target-32-{VERSION}.png", 32, True),
        (f"apple-touch-target-{VERSION}.png", 180, False),
        (f"pwa-target-192-{VERSION}.png", 192, False),
        (f"pwa-target-512-{VERSION}.png", 512, False),
        (f"mstile-target-150-{VERSION}.png", 150, False),
    ):
        save_png(PUBLIC, name, size, rounded)

    ico_source = render_icon(256, rounded=True)
    ico_source.save(
        PUBLIC / f"favicon-target-{VERSION}.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    main()
