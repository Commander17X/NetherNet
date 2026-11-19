"""Draw the NetherNet cube: half bedrock, half netherrack, joined by a glowing portal seam.

Writes the iOS app icon (1024x1024, no alpha), the splash image, favicons and the
transparent cube mark used by the app and the site. Run from the repository root:

    python3 tools/icon.py

Needs Pillow. The cube is drawn texel by texel in an isometric view, so it stays
crisp, and a blurred copy of the glowing texels gives the seam its light.
"""

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
APP_IMAGES = ROOT / "assets" / "images"
SITE_ASSETS = ROOT / "docs" / "assets"
GRID = 16

BEDROCK = ["#2E2E33", "#3B3B41", "#25252A", "#4A4A51", "#1B1B1F", "#5C5C64"]
BEDROCK_WEIGHTS = [28, 24, 18, 14, 10, 6]
NETHERRACK = ["#7A2420", "#8E2E28", "#6A1C1A", "#A33A2F", "#5A1614"]
NETHERRACK_WEIGHTS = [30, 24, 20, 14, 12]
LAVA = ["#FF9A2E", "#FFC94D", "#FF6A1F"]
PORTAL = ["#A55BFF", "#C792FF", "#8A3DF0"]
BACKGROUND = (12, 9, 17)


def rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def bedrock_face(rng):
    return [[(rgb(rng.choices(BEDROCK, BEDROCK_WEIGHTS)[0]), False) for _ in range(GRID)] for _ in range(GRID)]


def nether_face(rng, cracks):
    face = [[(rgb(rng.choices(NETHERRACK, NETHERRACK_WEIGHTS)[0]), False) for _ in range(GRID)] for _ in range(GRID)]
    for _ in range(cracks):
        x, y = rng.randrange(3, GRID), rng.randrange(GRID)
        for _ in range(rng.randint(4, 7)):
            face[y][x] = (rgb(rng.choice(LAVA)), True)
            x = max(1, min(GRID - 1, x + rng.choice([-1, 0, 1])))
            y = max(0, min(GRID - 1, y + rng.choice([0, 1, 1])))
    for _ in range(3):
        x, y = rng.randrange(GRID), rng.randrange(GRID)
        face[y][x] = (rgb(rng.choice(PORTAL)), True)
    return face


def shade(color, amount):
    return tuple(max(0, min(255, int(c * amount))) for c in color)


def draw_cube(size, transparent):
    """Return the cube image and a matching layer holding only the glowing texels."""
    rng = random.Random(58)
    half_w = size * 0.33
    half_h = half_w * 0.56
    depth = size * 0.35
    cx = size / 2
    top = (size - (half_h * 2 + depth)) / 2

    back = (cx, top)
    left = (cx - half_w, top + half_h)
    front = (cx, top + half_h * 2)
    right = (cx + half_w, top + half_h)

    bedrock_top, bedrock_left = bedrock_face(rng), bedrock_face(rng)
    nether_top, nether_right = nether_face(rng, 2), nether_face(rng, 4)

    background = (0, 0, 0, 0) if transparent else BACKGROUND + (255,)
    image = Image.new("RGBA", (size, size), background)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw, glow_draw = ImageDraw.Draw(image), ImageDraw.Draw(glow)

    def quad(origin, du, dv, u, v):
        ox, oy = origin
        corners = [(u, v), (u + 1, v), (u + 1, v + 1), (u, v + 1)]
        return [(ox + a * du[0] / GRID + b * dv[0] / GRID, oy + a * du[1] / GRID + b * dv[1] / GRID) for a, b in corners]

    def paint(origin, du, dv, pick, light):
        for v in range(GRID):
            for u in range(GRID):
                color, emissive = pick(u, v)
                points = quad(origin, du, dv, u, v)
                fill = color if emissive else shade(color, light)
                draw.polygon(points, fill=fill + (255,))
                if emissive:
                    glow_draw.polygon(points, fill=color + (255,))

    seam = rgb(PORTAL[1])

    def top_texel(u, v):
        # u runs from the back corner to the right corner, v from the back corner to the left.
        if u == v:
            return seam, True
        return bedrock_top[v][u] if v > u else nether_top[v][u]

    paint(back, (half_w, half_h), (-half_w, half_h), top_texel, 1.22)
    paint(left, (half_w, half_h), (0, depth), lambda u, v: bedrock_left[v][u], 0.7)
    paint(front, (half_w, -half_h), (0, depth), lambda u, v: nether_right[v][u], 0.78)

    seam_width = max(2, int(size * 0.012))
    seam_line = [back, front, (front[0], front[1] + depth)]
    draw.line(seam_line, fill=seam + (255,), width=seam_width)
    glow_draw.line(seam_line, fill=seam + (255,), width=seam_width * 3)

    outline = [back, right, (right[0], right[1] + depth), (front[0], front[1] + depth), (left[0], left[1] + depth), left]
    draw.line(outline + [back], fill=(6, 4, 8, 255), width=max(2, int(size * 0.011)), joint="curve")
    return image, glow


def render(size, transparent=False):
    cube, glow = draw_cube(size, transparent)
    halo = glow.filter(ImageFilter.GaussianBlur(size * 0.03))
    bloom = glow.filter(ImageFilter.GaussianBlur(size * 0.008))
    if transparent:
        base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        base.alpha_composite(halo)
        base.alpha_composite(cube)
        base.alpha_composite(bloom)
        return base
    backdrop = Image.new("RGBA", (size, size), BACKGROUND + (255,))
    aura = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(aura).ellipse(
        (size * 0.18, size * 0.16, size * 0.82, size * 0.86), fill=(130, 60, 235, 150)
    )
    ImageDraw.Draw(aura).ellipse((size * 0.5, size * 0.4, size * 0.95, size * 0.95), fill=(255, 90, 30, 70))
    backdrop.alpha_composite(aura.filter(ImageFilter.GaussianBlur(size * 0.12)))
    cube_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cube_layer.alpha_composite(halo)
    cube_layer.alpha_composite(halo)
    cube_only, _ = draw_cube(size, True)
    cube_layer.alpha_composite(cube_only)
    cube_layer.alpha_composite(bloom)
    backdrop.alpha_composite(cube_layer)
    return backdrop


def save(image, path, size=None, fmt="PNG"):
    if size and image.width != size:
        image = image.resize((size, size), Image.LANCZOS)
    if fmt == "PNG":
        image.save(path, "PNG", optimize=True)
    else:
        image.save(path, "WEBP", quality=92, method=6)
    print(f"{path.relative_to(ROOT)}  {image.width}x{image.height}  {path.stat().st_size} bytes")


def main():
    icon = render(1024).convert("RGB")
    save(icon, APP_IMAGES / "icon.png")
    save(icon, APP_IMAGES / "favicon.png", 64)
    save(icon, SITE_ASSETS / "icon.png", 256)
    save(icon, SITE_ASSETS / "favicon.png", 64)
    mark = render(1024, transparent=True)
    save(mark, APP_IMAGES / "splash-icon.png")
    save(mark, APP_IMAGES / "textures" / "cube.webp", 256, fmt="WEBP")
    save(mark, SITE_ASSETS / "cube.webp", 256, fmt="WEBP")


if __name__ == "__main__":
    main()
