import type { ProduceCategory, StorageMode } from "./enums";

/**
 * Storage guidance per crop.
 *
 * IMPORTANT: these are conservative starting points, NOT shelf-life predictions and NOT
 * reviewed by a food-safety or post-harvest specialist. `reviewed` stays false until one
 * has signed them off. Nothing here promises how long produce will last.
 */
export type CropProfile = {
  key: string;
  nameEn: string;
  nameBn: string;
  category: ProduceCategory;
  /** The mode to look for first. */
  preferredStorage: StorageMode;
  /** Modes this crop can sit in for a short stay. */
  acceptableStorage: StorageMode[];
  /** Crops that are harmed by refrigeration must never be routed to a cold hub. */
  avoidRefrigeration: boolean;
  /** Crop-specific ceiling for a short stay, in days. Always at most 3. */
  maxBookingDays: number;
  /** How quickly it loses value, used to rank urgency in the Recovery Engine. */
  perishability: "high" | "medium" | "low";
  handlingNotes: string;
  reviewed: false;
};

export const CROP_PROFILES = {
  tomato: {
    key: "tomato",
    nameEn: "Tomato",
    nameBn: "টমেটো",
    category: "fruiting",
    preferredStorage: "ventilated_ambient",
    acceptableStorage: ["ventilated_ambient"],
    avoidRefrigeration: true,
    maxBookingDays: 2,
    perishability: "high",
    handlingNotes: "Keep shaded, ventilated and in shallow layers. Separate soft or split fruit.",
    reviewed: false,
  },
  brinjal: {
    key: "brinjal",
    nameEn: "Brinjal",
    nameBn: "বেগুন",
    category: "fruiting",
    preferredStorage: "ventilated_ambient",
    acceptableStorage: ["ventilated_ambient"],
    avoidRefrigeration: true,
    maxBookingDays: 2,
    perishability: "medium",
    handlingNotes: "Keep shaded and ventilated. Avoid pressing or stacking deeply.",
    reviewed: false,
  },
  carrot: {
    key: "carrot",
    nameEn: "Carrot",
    nameBn: "গাজর",
    category: "root",
    preferredStorage: "cool",
    acceptableStorage: ["cool", "cold", "ventilated_ambient"],
    avoidRefrigeration: false,
    maxBookingDays: 3,
    perishability: "medium",
    handlingNotes: "Keep from drying out. Remove leafy tops if present.",
    reviewed: false,
  },
  beetroot: {
    key: "beetroot",
    nameEn: "Beetroot",
    nameBn: "বিট",
    category: "root",
    preferredStorage: "cool",
    acceptableStorage: ["cool", "cold", "ventilated_ambient"],
    avoidRefrigeration: false,
    maxBookingDays: 3,
    perishability: "medium",
    handlingNotes: "Keep from drying out. Trim leaves and keep them separate.",
    reviewed: false,
  },
  pumpkin: {
    key: "pumpkin",
    nameEn: "Pumpkin",
    nameBn: "কুমড়া",
    category: "gourd",
    preferredStorage: "ventilated_ambient",
    acceptableStorage: ["ventilated_ambient"],
    avoidRefrigeration: true,
    maxBookingDays: 3,
    perishability: "low",
    handlingNotes: "Keep dry and ventilated. Handle gently and check for soft patches.",
    reviewed: false,
  },
  bitter_gourd: {
    key: "bitter_gourd",
    nameEn: "Bitter gourd",
    nameBn: "করলা",
    category: "gourd",
    preferredStorage: "ventilated_ambient",
    acceptableStorage: ["ventilated_ambient", "cool"],
    avoidRefrigeration: true,
    maxBookingDays: 2,
    perishability: "medium",
    handlingNotes: "Keep shaded and ventilated. Separate any yellowing or soft pieces.",
    reviewed: false,
  },
  leafy_greens: {
    key: "leafy_greens",
    nameEn: "Leafy greens",
    nameBn: "শাক",
    category: "leafy",
    preferredStorage: "cool",
    acceptableStorage: ["cool", "cold"],
    avoidRefrigeration: false,
    maxBookingDays: 1,
    perishability: "high",
    handlingNotes: "Highly perishable. Keep cool, damp-not-wet and uncrushed. Short stay only.",
    reviewed: false,
  },
  potato: {
    key: "potato",
    nameEn: "Potato",
    nameBn: "আলু",
    category: "root",
    preferredStorage: "ventilated_ambient",
    acceptableStorage: ["ventilated_ambient", "cool"],
    avoidRefrigeration: true,
    maxBookingDays: 3,
    perishability: "low",
    handlingNotes: "Keep dark, dry and ventilated. Remove green or sprouting tubers.",
    reviewed: false,
  },
} as const satisfies Record<string, CropProfile>;

export type CropKey = keyof typeof CROP_PROFILES;
export const CROP_KEYS = Object.keys(CROP_PROFILES) as CropKey[];

export function getCropProfile(key: CropKey): CropProfile {
  return CROP_PROFILES[key];
}
