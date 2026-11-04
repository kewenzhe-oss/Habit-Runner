"""Generate the Open Graph share image for habit-running."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "og.jpg"
WIDTH, HEIGHT = 1200, 630
SUPERSAMPLE = 3
BLACK = "#000000"
RED = "#DC2626"
WHITE = "#FFFFFF"
MUTED = "#A3A3A3"
PINGFANG = (
    "/System/Library/AssetsV2/com_apple_MobileAsset_Font8/"
    "86ba2c91f017a3749571a82f2c6d890ac7ffb2fb.asset/AssetData/PingFang.ttc"
)
HELVETICA_NEUE = "/System/Library/Fonts/HelveticaNeue.ttc"
PINGFANG_SC_MEDIUM = 7
HELVETICA_NEUE_BOLD = 1

MARK_CENTER = (330, 315)
MARK_OUTER_RADIUS = 150
MARK_STROKE = 40
MARK_ANCHOR_RADIUS = 36
TEXT_LEFT = 600


def draw_mark(draw: ImageDraw.ImageDraw) -> None:
    cx, cy = (value * SUPERSAMPLE for value in MARK_CENTER)
    outer = MARK_OUTER_RADIUS * SUPERSAMPLE
    draw.arc(
        (cx - outer, cy - outer, cx + outer, cy + outer),
        start=0,
        end=300,
        fill=RED,
        width=MARK_STROKE * SUPERSAMPLE,
    )
    anchor = MARK_ANCHOR_RADIUS * SUPERSAMPLE
    draw.ellipse((cx - anchor, cy - anchor, cx + anchor, cy + anchor), fill=RED)


def main() -> None:
    image = Image.new("RGB", (WIDTH * SUPERSAMPLE, HEIGHT * SUPERSAMPLE), BLACK)
    draw = ImageDraw.Draw(image)
    draw_mark(draw)

    brand_font = ImageFont.truetype(
        HELVETICA_NEUE, 84 * SUPERSAMPLE, index=HELVETICA_NEUE_BOLD
    )
    line_font = ImageFont.truetype(
        PINGFANG, 36 * SUPERSAMPLE, index=PINGFANG_SC_MEDIUM
    )
    draw.text(
        (TEXT_LEFT * SUPERSAMPLE, 262 * SUPERSAMPLE),
        "habit-running",
        font=brand_font,
        fill=WHITE,
        anchor="ls",
    )
    draw.text(
        (TEXT_LEFT * SUPERSAMPLE, 338 * SUPERSAMPLE),
        "对自己的承诺，一天一天兑现。",
        font=line_font,
        fill=MUTED,
        anchor="ls",
    )

    image = image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    image.save(OUTPUT, quality=92, optimize=True)


if __name__ == "__main__":
    main()
