import React, { useEffect, useRef } from "react";
import { buildSampleMap } from "../maps/sampleMap.js";

const TILE = 32;
const DPR = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

const ZONE_META = {
  industrial: { label: "Khu Sản Xuất", emoji: "🏭" },
  marketplace: { label: "Khu Chợ", emoji: "🛒" },
  raw: { label: "Khu Nguyên Liệu", emoji: "🧱" },
  bank: { label: "Ngân Hàng", emoji: "🏦" },
  hq: { label: "Trụ Sở / Chính Phủ", emoji: "🏛️" },
};

export default function TileWorld({ gsRef, onInteract, onPortal, mapUrl }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const camRef = useRef({ x: 0, y: 0 });
  const inputRef = useRef({});
  const viewRef = useRef({ w: 960, h: 540 });
  const activeRef = useRef(false);
  const hoverZoneRef = useRef(null);
  const playerRef = useRef({
    x: 28 * TILE,
    y: 18 * TILE,
    w: 18,
    h: 24,
    speed: 150,
    facing: "down",
    frameT: 0,
  });
  const mapRef = useRef(null);

  // Responsive
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onEnter = () => (activeRef.current = true);
    const onLeave = () => (activeRef.current = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Load map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let map;
      if (mapUrl) {
        try {
          const res = await fetch(mapUrl);
          const json = await res.json();
          map = convertTiledToInternal(json);
        } catch {
          map = buildSampleMap();
        }
      } else map = buildSampleMap();
      if (cancelled) return;
      mapRef.current = map;
      if (map.spawn?.player) {
        playerRef.current.x = map.spawn.player.x;
        playerRef.current.y = map.spawn.player.y;
      }
      bootLoop();
    })();
    return () => {
      cancelled = true;
      stopLoop();
    };
  }, [mapUrl]);

  // Keyboard (vẫn hỗ trợ, nhưng không bắt buộc)
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      // Khi chuột đang ở canvas => chặn cuộn trang với phím mũi tên / Space
      if (
        activeRef.current &&
        (k === "arrowup" ||
          k === "arrowdown" ||
          k === "arrowleft" ||
          k === "arrowright" ||
          k === " ")
      ) {
        e.preventDefault();
      }
      inputRef.current[k] = true;
    };

    const onUp = (e) => {
      inputRef.current[e.key.toLowerCase()] = false;
    };

    // quan trọng: passive: false để được phép preventDefault (dù keydown thường không passive)
    window.addEventListener("keydown", onDown, { passive: false });
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Mouse: hover + click mở panel (UX dễ hiểu hơn)
  useEffect(() => {
    const canvas = canvasRef.current;
    const getWorldPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      return { x: camRef.current.x + cssX, y: camRef.current.y + cssY };
    };
    const onMove = (e) => {
      const map = mapRef.current;
      if (!map) return;
      const { x, y } = getWorldPos(e);
      let hover = null;
      for (const z of map.zones)
        if (pointInAABB(x, y, z)) {
          hover = z.key;
          break;
        }
      if (hoverZoneRef.current !== hover) {
        hoverZoneRef.current = hover;
        render();
      }
      canvas.style.cursor = hover ? "pointer" : "default";
    };
    const onClick = () => {
      if (hoverZoneRef.current) onInteract?.(hoverZoneRef.current);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [onInteract]);

  // Loop
  let rafId = null;
  let last = 0;
  const bootLoop = () => {
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  };
  const stopLoop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    render();
    rafId = requestAnimationFrame(frame);
  };

  function worldToTile(x, y, size = TILE) {
    return { tx: Math.floor(x / size), ty: Math.floor(y / size) };
  }
  function isSolidAt(map, px, py) {
    const { tx, ty } = worldToTile(px, py, map.tileSize);
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
    const gid = map.layers.collision[ty * map.width + tx];
    return gid !== 0;
  }

  // --- moveWithCollision ---
  function moveWithCollision(map, entity, dx, dy, dt) {
    // Tính vị trí mới theo vector
    const nx = entity.x + dx * entity.speed * dt;
    const ny = entity.y + dy * entity.speed * dt;

    // Các cạnh entity
    const Lx = nx - entity.w / 2;
    const Rx = nx + entity.w / 2;
    const Ty = ny - entity.h;
    const By = ny;

    // Kiểm tra va chạm theo trục X
    if (
      !(
        isSolidAt(map, Lx, entity.y - entity.h) ||
        isSolidAt(map, Rx, entity.y - entity.h) ||
        isSolidAt(map, Lx, entity.y) ||
        isSolidAt(map, Rx, entity.y)
      )
    ) {
      entity.x = nx;
    }

    // Kiểm tra va chạm theo trục Y
    if (
      !(
        isSolidAt(map, entity.x - entity.w / 2, Ty) ||
        isSolidAt(map, entity.x + entity.w / 2, Ty) ||
        isSolidAt(map, entity.x - entity.w / 2, By) ||
        isSolidAt(map, entity.x + entity.w / 2, By)
      )
    ) {
      entity.y = ny;
    }
  }

  // --- step ---
  function step(dt) {
    const map = mapRef.current;
    if (!map) return;

    const keys = inputRef.current;
    const p = playerRef.current;
    let dx = 0,
      dy = 0;

    // --- Player movement ---
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;

    if (dx || dy) {
      const inv = 1 / Math.hypot(dx, dy);
      dx *= inv;
      dy *= inv;
      p.frameT += dt * 8;
    } else p.frameT = 0;

    if (Math.abs(dx) > Math.abs(dy)) p.facing = dx < 0 ? "left" : "right";
    else if (dy) p.facing = dy < 0 ? "up" : "down";

    moveWithCollision(map, p, dx, dy, dt);

    // --- Camera ---
    const worldW = map.width * TILE;
    const worldH = map.height * TILE;
    const cam = camRef.current;
    const { w: VW, h: VH } = viewRef.current;
    cam.x = Math.max(0, Math.min(worldW - VW, p.x - VW / 2));
    cam.y = Math.max(0, Math.min(worldH - VH, p.y - VH / 2));

    // --- NPC movement ---
    if (gsRef?.current?.npcs) {
      for (const n of gsRef.current.npcs) {
        if (n.bankrupt) continue;

        // --- Khởi tạo ---
        n.dir ??= "down";
        n.speed ??= 40 + Math.random() * 40;
        n.changeDirT ??= Math.random() * 2 + 1;
        n.w ??= 16;
        n.h ??= 16;

        // --- Đếm ngược đổi hướng ---
        n.changeDirT -= dt;
        if (n.changeDirT <= 0) {
          const dirs = ["up", "down", "left", "right"];
          n.dir = dirs[Math.floor(Math.random() * dirs.length)];
          n.changeDirT = Math.random() * 2 + 1;
        }

        // --- Vector hướng ---
        let vx = 0,
          vy = 0;
        if (n.dir === "up") vy = -1;
        else if (n.dir === "down") vy = 1;
        else if (n.dir === "left") vx = -1;
        else if (n.dir === "right") vx = 1;

        if (vx || vy) {
          const inv = 1 / Math.hypot(vx, vy);
          vx *= inv;
          vy *= inv;
        }

        // --- Lưu vị trí cũ ---
        const oldX = n.pos.x,
          oldY = n.pos.y;

        // --- Di chuyển NPC ---
        const npcObj = {
          x: n.pos.x,
          y: n.pos.y,
          w: n.w,
          h: n.h,
          speed: n.speed,
        };
        moveWithCollision(map, npcObj, vx, vy, dt);
        n.pos.x = npcObj.x;
        n.pos.y = npcObj.y;

        // --- Nếu bị kẹt, đổi hướng ---
        if (oldX === n.pos.x && oldY === n.pos.y) {
          const dirs = ["up", "down", "left", "right"];
          n.dir = dirs[Math.floor(Math.random() * dirs.length)];
        }
      }
    }
  }

  // ===== Render =====
  function render() {
    const map = mapRef.current;
    if (!map) return;
    const { w: VW, h: VH } = viewRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.style.width = `${VW}px`;
    canvas.style.height = `${VH}px`;
    canvas.width = Math.floor(VW * DPR);
    canvas.height = Math.floor(VH * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const cam = camRef.current;
    const tsz = map.tileSize || TILE;
    ctx.fillStyle = "#0a1220";
    ctx.fillRect(0, 0, VW, VH);

    const sx = Math.floor(cam.x / tsz),
      sy = Math.floor(cam.y / tsz);
    const ex = Math.ceil((cam.x + VW) / tsz),
      ey = Math.ceil((cam.y + VH) / tsz);

    // Ground
    for (let ty = sy; ty < ey; ty++)
      for (let tx = sx; tx < ex; tx++) {
        if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
        const id = map.layers.ground[ty * map.width + tx];
        drawTile(ctx, id, tx * tsz - cam.x, ty * tsz - cam.y, tsz);
      }
    // Buildings
    for (let ty = sy; ty < ey; ty++)
      for (let tx = sx; tx < ex; tx++) {
        if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
        const id = map.layers.collision[ty * map.width + tx];
        if (id) drawTile(ctx, 2, tx * tsz - cam.x, ty * tsz - cam.y, tsz);
      }

    // Zones (overlay + icon + nhãn + hover)
    drawZones(ctx, map, cam, hoverZoneRef.current);

    // Portal
    drawPortals(ctx, map, cam);

    // NPCs
    const gs = gsRef?.current;
    if (gs)
      for (const n of gs.npcs) {
        if (n.bankrupt) continue;
        drawSprite(ctx, n.pos.x - cam.x, n.pos.y - cam.y, n.color);
      }

    // Player + nhãn “Bạn”
    const p = playerRef.current;
    drawSprite(ctx, p.x - cam.x, p.y - cam.y, "#60a5fa");
    ctx.fillStyle = "rgba(203,213,225,0.95)";
    ctx.font = "bold 12px ui-sans-serif";
    ctx.fillText("Bạn (doanh nghiệp)", p.x - cam.x - 50, p.y - cam.y - 26);

    // Hint
    ctx.fillStyle = "#99a2b3";
    ctx.font = "12px ui-sans-serif";
    ctx.fillText(
      "Di chuyển: WASD/Arrows · Nhấp vào khu để mở panel",
      12,
      VH - 12
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-xl ring-1 ring-slate-700 z-0"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

function drawTile(ctx, id, sx, sy, size) {
  switch (id) {
    case 1:
      ctx.fillStyle = "#0b462c";
      break; // cỏ
    case 2:
      ctx.fillStyle = "#1f2937";
      break; // nhà/tường
    case 3:
      ctx.fillStyle = "#8b5a2b";
      break; // đường
    case 4:
      ctx.fillStyle = "#0f5ec2";
      break; // nước
    default:
      return;
  }
  ctx.fillRect(sx, sy, size, size);
}

function drawSprite(ctx, x, y, color = "#60a5fa") {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x - 8), Math.floor(y - 20), 16, 20);
}

function drawZones(ctx, map, cam, hoverKey) {
  // overlay
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#0f172a";
  for (const z of map.zones) ctx.fillRect(z.x - cam.x, z.y - cam.y, z.w, z.h);
  ctx.restore();

  for (const z of map.zones) {
    const meta = ZONE_META[z.key] || { label: z.key, emoji: "⬛" };
    const x = z.x - cam.x,
      y = z.y - cam.y,
      w = z.w,
      h = z.h;
    // khung
    ctx.strokeStyle =
      hoverKey === z.key ? "rgba(94,234,212,0.9)" : "rgba(148,163,184,0.6)";
    ctx.lineWidth = hoverKey === z.key ? 3 : 2;
    ctx.strokeRect(x, y, w, h);

    // icon + label (giữa zone)
    const cx = x + w / 2,
      cy = y + h / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = "24px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";
    ctx.fillText(meta.emoji, cx, cy - 6);
    ctx.font = "bold 13px ui-sans-serif";
    ctx.fillText(meta.label, cx, cy + 16);

    if (hoverKey === z.key) {
      ctx.font = "12px ui-sans-serif";
      ctx.fillStyle = "rgba(94,234,212,0.95)";
      ctx.fillText("Nhấp để mở", cx, cy + 32);
    }
    ctx.textAlign = "left";
  }
}

function drawPortals(ctx, map, cam) {
  for (const p of map.portals) {
    const x = p.x - cam.x,
      y = p.y - cam.y,
      w = p.w,
      h = p.h;
    ctx.fillStyle = "rgba(56,189,248,0.18)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(56,189,248,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "rgba(165,243,252,0.95)";
    ctx.font = "bold 12px ui-sans-serif";
  }
}

function pointInAABB(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function convertTiledToInternal(tiled) {
  const width = tiled.width,
    height = tiled.height,
    tileSize = tiled.tilewidth;
  const layers = {
    ground: Array(width * height).fill(0),
    decor: Array(width * height).fill(0),
    collision: Array(width * height).fill(0),
    above: Array(width * height).fill(0),
  };
  const zones = [],
    portals = [];
  for (const l of tiled.layers) {
    if (l.type === "tilelayer") {
      const name = l.name.toLowerCase();
      if (name.includes("ground")) layers.ground = l.data.slice();
      else if (name.includes("decor")) layers.decor = l.data.slice();
      else if (name.includes("coll"))
        layers.collision = l.data.map((v) => (v ? 2 : 0));
      else if (name.includes("above")) layers.above = l.data.slice();
    } else if (l.type === "objectgroup") {
      for (const o of l.objects) {
        if (o.type === "zone")
          zones.push({ key: o.name, x: o.x, y: o.y, w: o.width, h: o.height });
        if (o.type === "portal")
          portals.push({
            target: o.name || "newland",
            x: o.x,
            y: o.y,
            w: o.width,
            h: o.height,
          });
      }
    }
  }
  return { width, height, tileSize, layers, zones, portals };
}
