export const DPR =
  typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const rand = (min, max) => Math.random() * (max - min) + min;
export const lerp = (a, b, t) => a + (b - a) * t;

export function roundRect(
  ctx,
  x,
  y,
  width,
  height,
  radius,
  fill = true,
  stroke = true
) {
  if (typeof radius === "number")
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  else radius = { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
