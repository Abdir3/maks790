/**
 * Synthetic blood-gas arithmetic, not a diagnostic or treatment algorithm.
 * Radiometer ABL90 FLEX IFU, chapter 11, printed p. 277, equations 4 and 7:
 * https://www.ruh.nhs.uk/pathology/documents/poct/SOP_Radiometer_ABL90_Flex_IFU_Instructions.pdf
 * Verified 2026-10-28. pCO2/pO2 are kPa, HCO3 and SBE(Ecf) are mmol/L;
 * pH and gases refer to the analyzer's 37 °C results, not temperature-corrected results.
 * HCO3 is actual plasma bicarbonate, NOT standard bicarbonate or total CO2.
 * baseExcess is cBase(Ecf), NOT hemoglobin-dependent cBase(B).
 */
export type BloodGasInput = {
  sampleType: "arterial" | "venous";
  sampledAt: string;
  oxygen: string;
  pH: number;
  pCO2: number;
  pO2: number;
};

export type CalculatedBloodGas = BloodGasInput & {
  bicarbonate: number;
  baseExcess: number;
};

export const BLOOD_GAS_REFERENCE_SOURCE = "https://labfag.no/emne/ckcc7Kac";

/** Local laboratory guidance, not universal diagnostic thresholds. */
export function bloodGasReferenceRanges(sampleType: BloodGasInput["sampleType"], ageYears: number) {
  const child = ageYears < 19;
  const infant = ageYears < 1;
  const venous = sampleType === "venous";
  return {
    pH: venous ? (child ? "7,31–7,41" : "7,31–7,42") : child ? "7,35–7,45" : "7,38–7,46",
    pCO2: venous
      ? ageYears < 5
        ? "Øvre grense 6,8 kPa; vurder alder"
        : "5,3–7,9 kPa"
      : "4,3–6,0 kPa",
    pO2: venous
      ? "Ikke referanse for arteriell oksygenering"
      : infant
        ? "Aldersavhengig; nyfødte krever alder i timer/døgn"
        : ageYears < 60
          ? "11,0–14,4 kPa (romluft)"
          : ageYears < 70
            ? ">10,6 kPa (romluft)"
            : ageYears < 80
              ? ">9,3 kPa (romluft)"
              : ">8,0 kPa (romluft)",
    bicarbonate: venous ? "24–31 mmol/L (aktuelt HCO₃⁻)" : "21–27 mmol/L (aktuelt HCO₃⁻)",
    baseExcess: child
      ? "Alders- og metodeavhengig"
      : venous
        ? "Laboratoriets BE: −1,0 til +5,4 mmol/L"
        : "Laboratoriets BE: −3 til +3 mmol/L",
    note:
      "Veiledende lokale intervaller fra Sykehuset Østfold (07.10.2026), ikke behandlingsmål. " +
      "HCO₃⁻ er aktuell bikarbonat. Casens SBE(Ecf) er beregnet; laboratoriets generelle BE-intervall er ikke en egen validert SBE(Ecf)-grense. " +
      (child
        ? "CO₂/HCO₃-intervallene bygger hovedsakelig på voksne; barn krever aldersvurdering, særlig spedbarn. "
        : "") +
      "Oksygenering vurderes sammen med oksygentilførsel og klinikk; venøs pO₂ erstatter ikke arteriell pO₂.",
    sourceUrl: BLOOD_GAS_REFERENCE_SOURCE,
  };
}

/** Optional reported derived values support consistency checks on imported cases. */
type CheckableBloodGas = BloodGasInput &
  Partial<Pick<CalculatedBloodGas, "bicarbonate" | "baseExcess">>;

function derive(pH: number, pCO2: number) {
  const bicarbonate = 0.23 * pCO2 * 10 ** (pH - 6.095);
  return { bicarbonate, baseExcess: bicarbonate - 24.8 + 16.2 * (pH - 7.4) };
}

/**
 * Reject missing context, impossible input and inconsistent reported calculations.
 * Broad input bounds are a synthetic-data sanity check, not normal ranges or
 * a clinical survivability rule. No fixed compensation, V-A, SpO2/pO2 or
 * respiratory-rate relationship is imposed: those need clinical review.
 * Derived results are checked to 0.11 mmol/L, allowing one-decimal display rounding.
 */
export function validateBloodGas(input: CheckableBloodGas): string[] {
  const issues: string[] = [];
  if (!input || typeof input !== "object") return ["Blodgassen mangler."];
  if (input.sampleType !== "arterial" && input.sampleType !== "venous")
    issues.push("Blodgass: prøvetype må være arteriell eller venøs.");
  if (typeof input.sampledAt !== "string" || !input.sampledAt.trim())
    issues.push("Blodgass: prøvetidspunkt må oppgis i casens tidslinje.");
  if (typeof input.oxygen !== "string" || !input.oxygen.trim())
    issues.push("Blodgass: romluft eller oksygentilførsel ved prøvetaking må oppgis.");
  if (!Number.isFinite(input.pH) || input.pH < 6 || input.pH > 8.5)
    issues.push("Blodgass: pH ligger utenfor støttet område 6–8,5.");
  if (!Number.isFinite(input.pCO2) || input.pCO2 <= 0 || input.pCO2 > 35)
    issues.push("Blodgass: pCO₂ må være positiv og angitt i kPa (høyst 35).");
  if (!Number.isFinite(input.pO2) || input.pO2 < 0 || input.pO2 > 100)
    issues.push("Blodgass: pO₂ må være angitt i kPa innenfor 0–100.");
  if (issues.length) return issues;
  const calculated = derive(input.pH, input.pCO2);
  if (
    input.bicarbonate !== undefined &&
    (!Number.isFinite(input.bicarbonate) ||
      Math.abs(input.bicarbonate - calculated.bicarbonate) > 0.11)
  )
    issues.push("Blodgass: aktuelt HCO₃⁻ stemmer ikke med pH og pCO₂.");
  if (
    input.baseExcess !== undefined &&
    (!Number.isFinite(input.baseExcess) ||
      Math.abs(input.baseExcess - calculated.baseExcess) > 0.11)
  )
    issues.push("Blodgass: SBE(Ecf) stemmer ikke med pH og aktuelt HCO₃⁻.");
  return issues;
}

/** Compute from primary inputs, keeping precision until presentation. */
export function calculateBloodGas(input: BloodGasInput): CalculatedBloodGas {
  // Deliberately reconstruct the input so caller-supplied derived fields cannot
  // override the deterministic values or prevent repairing an inconsistent row.
  const primary: BloodGasInput = {
    sampleType: input.sampleType,
    sampledAt: input.sampledAt,
    oxygen: input.oxygen,
    pH: input.pH,
    pCO2: input.pCO2,
    pO2: input.pO2,
  };
  const issues = validateBloodGas(primary);
  if (issues.length) throw new Error(issues.join(" "));
  return { ...primary, ...derive(primary.pH, primary.pCO2) };
}
