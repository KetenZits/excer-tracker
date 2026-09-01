import type { Unit } from "./types";

const KG_TO_LB = 2.2046226218;

export function toDisplay(kg: number, unit: Unit): number {
  const value = unit === "lb" ? kg * KG_TO_LB : kg;
  return Math.round(value * 10) / 10;
}

export function fromDisplay(value: number, unit: Unit): number {
  const kg = unit === "lb" ? value / KG_TO_LB : value;
  return Math.round(kg * 100) / 100;
}

export function formatWeight(kg: number, unit: Unit): string {
  const value = toDisplay(kg, unit);
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text} ${unit}`;
}

export function weightStep(unit: Unit): number {
  return unit === "lb" ? 5 : 2.5;
}
