import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseNutritionalTable } from "../src/ocr.js";

describe("OCR Module - parseNutritionalTable", () => {

  describe("AC-1: OCR Extraction - Chocolate Bar (German)", () => {
    // Image 1: Chocolate Bar
    // German headers: Energie, Fett, davon gesättigte Fettsäuren, Kohlenhydrate, davon Zucker, Ballaststoffe, Eiweiß, Salz
    // Values per 100g: 2292 kJ / 549 kcal, 33g, 13g, 55g, 45g, 2.4g, 6.8g, 0.18g
    // Serving: 30g (1 Melto)
    const rawText = `Nährwertdeklaration
Energie 2292 kJ / 549 kcal
Fett 33 g
davon gesättigte Fettsäuren 13 g
Kohlenhydrate 55 g
davon Zucker 45 g
Ballaststoffe 2,4 g
Eiweiß 6,8 g
Salz 0,18 g
Serving Size: 30 g`;

    test("parses German nutritional table correctly", () => {
      const result = parseNutritionalTable(rawText, "de");
      assert.equal(result.energyKj, 2292);
      assert.equal(result.energyKcal, 549);
      assert.equal(result.fat, 33);
      assert.equal(result.saturates, 13);
      assert.equal(result.carbohydrates, 55);
      assert.equal(result.sugars, 45);
      assert.equal(result.fiber, 2.4);
      assert.equal(result.protein, 6.8);
      assert.equal(result.salt, 0.18);
      assert.equal(result.servingSize, 30);
      assert.equal(result.servingUnit, "g");
    });
  });

  describe("AC-1: OCR Extraction - Juice Bottle (Dutch)", () => {
    // Image 2: Juice Bottle
    // Dutch headers: energie, vetten, waarvan verzadigde vetzuren, koolhydraten, waarvan suikers, vezels, eiwitten, zout
    // Values per 100ml: 199 kJ / 47 kcal, 0g fat, 0g saturates, 11g carbs, 10g sugars, 0g fiber, 0.7g protein, 0g salt
    // Serving: 200 ml
    const rawText = `Voedingswaarde per 100 ml
energie 199 kJ / 47 kcal
vetten 0 g
waarvan verzadigde vetzuren 0 g
koolhydraten 11 g
waarvan suikers 10 g
vezels 0 g
eiwitten 0,7 g
zout 0 g
Serving Size: 200 ml`;

    test("parses Dutch nutritional table correctly", () => {
      const result = parseNutritionalTable(rawText, "nl");
      assert.equal(result.energyKj, 199);
      assert.equal(result.energyKcal, 47);
      assert.equal(result.fat, 0);
      assert.equal(result.saturates, 0);
      assert.equal(result.carbohydrates, 11);
      assert.equal(result.sugars, 10);
      assert.equal(result.fiber, 0);
      assert.equal(result.protein, 0.7);
      assert.equal(result.salt, 0);
      assert.equal(result.servingSize, 200);
      assert.equal(result.servingUnit, "ml");
    });
  });

  describe("AC-1: OCR Extraction - Olive Oil Spray (Dutch)", () => {
    // Image 3: Olive Oil Spray
    // Dutch headers: energie, vetten, koolhydraten, vezels, eiwitten, zout
    // Values per 100ml: 3404 kJ / 828 kcal, 14g fat, 0g carbs, 0g fiber, 0g protein, 0g salt
    // Serving: 5 ml (0 g)
    const rawText = `Voedingswaarde per 100 ml
energie 3404 kJ / 828 kcal
vetten 14 g
koolhydraten 0 g
vezels 0 g
eiwitten 0 g
zout 0 g
Serving Size: 5 ml`;

    test("parses Dutch nutritional table with 0g serving weight correctly", () => {
      const result = parseNutritionalTable(rawText, "nl");
      assert.equal(result.energyKj, 3404);
      assert.equal(result.energyKcal, 828);
      assert.equal(result.fat, 14);
      assert.equal(result.carbohydrates, 0);
      assert.equal(result.servingSize, 5);
      assert.equal(result.servingUnit, "ml");
    });
  });

  describe("AC-1: OCR Extraction - Error Handling", () => {
    test("throws error for empty input", () => {
      assert.throws(() => parseNutritionalTable("", "en"), { message: /Invalid/ });
    });

    test("throws error for input with no nutritional data", () => {
      assert.throws(() => parseNutritionalTable("This is just random text", "en"), { message: /Invalid/ });
    });
  });
});