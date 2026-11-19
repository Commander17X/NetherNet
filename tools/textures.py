"""Draw the NetherNet block textures, block icon and wordmark as .webp files.

Every texture is a 16x16 pixel grid made from a fixed seed, so the output is the
same on every run. Run from the repository root:

    python3 tools/textures.py

Needs Pillow. App textures, plus darker dirt for header bands, are written at @3x for crisp tiling on iPhone. The
site gets the 16x16 originals and scales them with `image-rendering: pixelated`.
"""

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
APP_DIR = ROOT / "assets" / "images" / "textures"
SITE_DIR = ROOT / "docs" / "assets"
FONT = ROOT / "node_modules" / "@expo-google-fonts" / "press-start-2p" / "400Regular" / "PressStart2P_400Regular.ttf"

DIRT = ["#7A5233", "#6B4629", "#86603F", "#5C3B22", "#93694A"]
DIRT_WEIGHTS = [34, 28, 18, 12, 8]
GRASS = ["#5C9A2E", "#4E8826", "#69AC37", "#437820", "#77BE40"]
GRASS_WEIGHTS = [32, 26, 20, 12, 10]
STONE = ["#7A7A7A", "#6A6A6A", "#888888", "#5B5B5B", "#949494"]
STONE_WEIGHTS = [34, 26, 18, 14, 8]
SIZE = 16


def noise(rng, palette, weights, width=SIZE, height=SIZE):
    return [[rng.choices(palette, weights)[0] for _ in range(width)] for _ in range(height)]


def to_image(grid):
    height, width = len(grid), len(grid[0])
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, color in enumerate(row):
            if color:
                image.putpixel((x, y), color if isinstance(color, tuple) else hex_rgba(color))
    return image


def hex_rgba(value, alpha=255):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def shade(color, amount):
    r, g, b, a = hex_rgba(color) if isinstance(color, str) else color
    return tuple(max(0, min(255, int(c * amount))) for c in (r, g, b)) + (a,)


def dirt(rng):
    grid = noise(rng, DIRT, DIRT_WEIGHTS)
    for _ in range(6):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        grid[y][x] = "#A27A58"
        grid[y][(x + 1) % SIZE] = "#4A2F1B"
    return grid


def grass_top(rng):
    grid = noise(rng, GRASS, GRASS_WEIGHTS)
    for _ in range(10):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        grid[y][x] = "#86CC4C"
        grid[(y + 1) % SIZE][x] = "#3C6E1C"
    return grid


def stone(rng):
    grid = noise(rng, STONE, STONE_WEIGHTS)
    for _ in range(5):
        x, y = rng.randrange(SIZE - 3), rng.randrange(SIZE)
        for i in range(rng.randint(2, 3)):
            grid[y][x + i] = "#4F4F4F"
    return grid


def drip_depths(rng, base, spread):
    depths, depth = [], base
    for _ in range(SIZE):
        depth = max(base - 1, min(base + spread, depth + rng.choice([-1, 0, 0, 1])))
        depths.append(depth)
    depths[-1] = depths[0]
    return depths


def grass_side(rng):
    grid = dirt(rng)
    top = grass_top(rng)
    for x, depth in enumerate(drip_depths(rng, 3, 3)):
        for y in range(depth):
            grid[y][x] = top[y][x]
        grid[depth][x] = "#3E6B1E" if rng.random() < 0.5 else grid[depth][x]
    return grid


def grass_edge(rng):
    """A strip of grass with uneven drips and a clear bottom, laid over dirt."""
    top = grass_top(rng)
    grid = [[None] * SIZE for _ in range(8)]
    for x, depth in enumerate(drip_depths(rng, 3, 4)):
        for y in range(min(depth, 8)):
            grid[y][x] = top[y][x]
        if depth < 8:
            grid[depth][x] = (20, 34, 10, 120)
    return grid


def dirt_edge(rng):
    """The ragged bottom of a dirt band, with a soft pixel shadow under it."""
    soil = dirt(rng)
    grid = [[None] * SIZE for _ in range(8)]
    for x, depth in enumerate(drip_depths(rng, 3, 4)):
        for y in range(min(depth, 8)):
            grid[y][x] = soil[y][x]
        if depth < 8:
            grid[depth][x] = (0, 0, 0, 110)
    return grid


def block_icon():
    """An isometric grass block, drawn texel by texel and scaled without smoothing."""
    rng = random.Random(7)
    top = to_image(grass_top(rng))
    side = to_image(grass_side(rng))
    scale = 8
    top_big = top.resize((SIZE * scale, SIZE * scale), Image.NEAREST)
    side_big = side.resize((SIZE * scale, SIZE * scale), Image.NEAREST)
    width = SIZE * scale * 2
    canvas = Image.new("RGBA", (width, int(width * 1.15)), (0, 0, 0, 0))
    half = SIZE * scale
    top_face = top_big.rotate(45, resample=Image.NEAREST, expand=True)
    top_face = top_face.resize((width, half), Image.NEAREST)
    canvas.alpha_composite(top_face, (0, 0))
    left = side_big.transform(
        (half, int(half * 1.5)), Image.AFFINE, (1, 0, 0, -0.5, 1, 0), resample=Image.NEAREST
    )
    right = side_big.transform(
        (half, int(half * 1.5)), Image.AFFINE, (1, 0, 0, 0.5, 1, -half * 0.5), resample=Image.NEAREST
    )
    canvas.alpha_composite(darken(left, 0.82), (0, half // 2))
    canvas.alpha_composite(darken(right, 0.64), (half, half // 2))
    return canvas.crop(canvas.getbbox())


def darken(image, amount):
    r, g, b, a = image.split()
    r, g, b = (channel.point(lambda v: int(v * amount)) for channel in (r, g, b))
    return Image.merge("RGBA", (r, g, b, a))


def wordmark(text="NETHERNET"):
    """Blocky letters with a grass top, dirt body, dark outline and drop shadow."""
    font = ImageFont.truetype(str(FONT), 8)
    left, top, right, bottom = font.getbbox(text)
    width, height = right - left, bottom - top
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).text((-left, -top), text, font=font, fill=255)
    pad = 2
    out = Image.new("RGBA", (width + pad * 2 + 1, height + pad * 2 + 1), (0, 0, 0, 0))
    rng = random.Random(11)
    soil, green = dirt(rng), grass_top(rng)
    pixels = mask.load()
    solid = lambda x, y: 0 <= x < width and 0 <= y < height and pixels[x, y] > 127
    for y in range(-1, height + 1):
        for x in range(-1, width + 1):
            near = any(solid(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            if near and not solid(x, y):
                out.putpixel((x + pad, y + pad), hex_rgba("#1A0F08"))
                out.putpixel((x + pad + 1, y + pad + 1), hex_rgba("#0A0604"))
    for y in range(height):
        for x in range(width):
            if solid(x, y):
                color = green[y % SIZE][x % SIZE] if y < 3 else soil[y % SIZE][x % SIZE]
                out.putpixel((x + pad, y + pad), shade(color, 1.0 if y < 3 else 1.3))
    return out


def save(image, path, scale=1):
    path.parent.mkdir(parents=True, exist_ok=True)
    if scale != 1:
        image = image.resize((image.width * scale, image.height * scale), Image.NEAREST)
    image.save(path, "WEBP", lossless=True, quality=100, method=6)
    print(f"{path.relative_to(ROOT)}  {image.width}x{image.height}  {path.stat().st_size} bytes")


def main():
    tiles = {
        "dirt": to_image(dirt(random.Random(1))),
        "grass": to_image(grass_top(random.Random(2))),
        "grass-side": to_image(grass_side(random.Random(3))),
        "stone": to_image(stone(random.Random(4))),
        "grass-edge": to_image(grass_edge(random.Random(5))),
        "dirt-edge": to_image(dirt_edge(random.Random(6))),
    }
    for name, image in tiles.items():
        save(image, APP_DIR / f"{name}@3x.webp", 12)
        save(image, SITE_DIR / f"{name}.webp")
    for name in ("dirt", "dirt-edge"):
        save(darken(tiles[name], 0.52), APP_DIR / f"{name}-dark@3x.webp", 12)
    icon = block_icon()
    save(icon, SITE_DIR / "block.webp")
    mark = wordmark()
    save(mark, APP_DIR / "wordmark@3x.webp", 12)
    save(mark, SITE_DIR / "wordmark.webp", 8)


if __name__ == "__main__":
    main()
