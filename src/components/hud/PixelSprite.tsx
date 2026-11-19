import { memo } from "react";
import { View } from "react-native";

export type SpriteMap = {
  rows: string[];
  palette: Record<string, string>;
};

type Run = { x: number; y: number; length: number; color: string };

function toRuns(sprite: SpriteMap): Run[] {
  const runs: Run[] = [];
  sprite.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      const color = sprite.palette[key];
      if (!color) {
        x += 1;
        continue;
      }
      let length = 1;
      while (x + length < row.length && row[x + length] === key) {
        length += 1;
      }
      runs.push({ x, y, length, color });
      x += length;
    }
  });
  return runs;
}

const runCache = new WeakMap<SpriteMap, Run[]>();

function runsFor(sprite: SpriteMap): Run[] {
  let runs = runCache.get(sprite);
  if (!runs) {
    runs = toRuns(sprite);
    runCache.set(sprite, runs);
  }
  return runs;
}

export const PixelSprite = memo(function PixelSprite({ sprite, pixel = 2 }: { sprite: SpriteMap; pixel?: number }) {
  const width = Math.max(...sprite.rows.map((row) => row.length)) * pixel;
  const height = sprite.rows.length * pixel;
  return (
    <View style={{ width, height }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {runsFor(sprite).map((run, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            left: run.x * pixel,
            top: run.y * pixel,
            width: run.length * pixel,
            height: pixel,
            backgroundColor: run.color,
          }}
        />
      ))}
    </View>
  );
});
