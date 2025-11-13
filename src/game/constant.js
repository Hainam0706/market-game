export const CANVAS_W = 1080;
export const CANVAS_H = 640;
export const START_SOCIAL_VALUE = 10;
export const START_INDIVIDUAL_VALUE = 10;
export const RAW_MATERIAL_BASE = 4;
export const WAGE_BASE = 3;
export const HOURS_BASE = 8;
export const UPGRADE_STEP = 1;
export const UPGRADE_MIN = 5;
export const NPC_COUNT = 4;
export const ECONOMY_STEP_S = 1;
export const LOAN_YEARLY_RATE = 0.12;
export const CRISIS_PERIOD_S = 120; // 2 phút

export const ZONES = {
  industrial: { x: 40, y: 80, w: 320, h: 220, name: "Khu Sản Xuất" },
  marketplace: { x: 400, y: 80, w: 320, h: 220, name: "Khu Chợ" },
  raw: { x: 760, y: 80, w: 280, h: 220, name: "Khu Nguyên Liệu" },
  bank: { x: 40, y: 340, w: 240, h: 220, name: "Ngân Hàng" },
  bulletin: { x: 320, y: 340, w: 340, h: 220, name: "Bảng Tin Kinh Tế" },
  hq: { x: 700, y: 340, w: 340, h: 220, name: "Trụ Sở / Chính Phủ" },
};

export const Stage = {
  COMPETITION: "COMPETITION",
  MONOPOLY: "MONOPOLY",
};
