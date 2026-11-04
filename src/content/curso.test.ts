import { describe, it, expect } from "vitest";
import { courseContent } from "./curso";
import { isPlaceholder } from "@/lib/placeholder";

describe("courseContent pending data", () => {
  it("points the checkout URL at the internal /inscricao route", () => {
    expect(courseContent.investment.checkoutUrl).toBe("/inscricao");
    expect(courseContent.hero.checkoutUrl).toBe("/inscricao");
  });

  it("marks the associado price fields as pending", () => {
    expect(isPlaceholder(courseContent.investment.associadoPrice)).toBe(true);
    expect(isPlaceholder(courseContent.investment.associadoEarlyBirdPrice)).toBe(true);
  });

  it("has a machine-readable early-bird deadline that ends after the whole display date in BRT", () => {
    // Display: "20 de dezembro de 2026" -> early bird ends at the start of
    // Dec 21 in Brasília time (UTC-3), i.e. 03:00 UTC on Dec 21.
    expect(courseContent.investment.earlyBirdDeadline).toBe("20 de dezembro de 2026");
    expect(courseContent.investment.earlyBirdDeadlineISO).toBe("2026-12-21T00:00:00-03:00");
    expect(new Date(courseContent.investment.earlyBirdDeadlineISO).toISOString()).toBe(
      "2026-12-21T03:00:00.000Z",
    );
  });

  it("has real (non-placeholder) footer social links now that they're confirmed", () => {
    expect(isPlaceholder(courseContent.socialLinks.linkedin)).toBe(false);
    expect(isPlaceholder(courseContent.socialLinks.youtube)).toBe(false);
    expect(courseContent.socialLinks.linkedin).toBe("https://www.linkedin.com/company/abvcap/");
    expect(courseContent.socialLinks.youtube).toBe("https://www.youtube.com/@ABVCAPVideos");
  });

  it("has a real (non-placeholder) next cohort date now that it's confirmed", () => {
    expect(isPlaceholder(courseContent.investment.nextCohortDate)).toBe(false);
    expect(courseContent.investment.nextCohortDate).toBe("16 de fevereiro de 2027");
  });

  it("has a real (non-placeholder) price now that it's confirmed", () => {
    expect(isPlaceholder(courseContent.investment.price)).toBe(false);
  });

  it("has real (non-placeholder) values for the confirmed investment fields", () => {
    expect(isPlaceholder(courseContent.investment.earlyBirdPrice)).toBe(false);
    expect(isPlaceholder(courseContent.investment.earlyBirdDeadline)).toBe(false);
    expect(isPlaceholder(courseContent.investment.seatsLimit)).toBe(false);
    expect(isPlaceholder(courseContent.investment.workloadHours)).toBe(false);
  });

  it("has real name, role, photo and LinkedIn for the sole confirmed professor", () => {
    expect(courseContent.faculty).toHaveLength(1);
    const [confirmed] = courseContent.faculty;
    expect(isPlaceholder(confirmed.name)).toBe(false);
    expect(isPlaceholder(confirmed.role)).toBe(false);
    expect(isPlaceholder(confirmed.bio)).toBe(false);
    expect(isPlaceholder(confirmed.photo)).toBe(false);
    expect(confirmed.photo).toBe("/brand/pedro-di-palma.png");
    expect(isPlaceholder(confirmed.linkedin)).toBe(false);
    expect(confirmed.linkedin).toBe(
      "https://www.linkedin.com/in/pedro-henrique-di-palma-cga-cge-bb912930/",
    );
    expect(isPlaceholder(confirmed.quote)).toBe(false);
    expect(confirmed.companies.length).toBeGreaterThan(0);
    for (const company of confirmed.companies) {
      expect(isPlaceholder(company)).toBe(true);
    }
  });

  it("marks every testimonial's fields as placeholders", () => {
    expect(courseContent.testimonials.length).toBeGreaterThan(0);
    for (const testimonial of courseContent.testimonials) {
      expect(isPlaceholder(testimonial.quote)).toBe(true);
      expect(isPlaceholder(testimonial.author)).toBe(true);
      expect(isPlaceholder(testimonial.role)).toBe(true);
      expect(isPlaceholder(testimonial.company)).toBe(true);
      expect(isPlaceholder(testimonial.photo)).toBe(true);
    }
  });

  it("does not mark real copy fields as placeholders", () => {
    expect(isPlaceholder(courseContent.hero.eyebrow)).toBe(false);
    expect(isPlaceholder(courseContent.hero.subheadline)).toBe(false);
    for (const line of courseContent.hero.headlineLines) {
      expect(isPlaceholder(line)).toBe(false);
    }
    for (const profile of courseContent.audienceProfiles) {
      expect(isPlaceholder(profile.title)).toBe(false);
      expect(isPlaceholder(profile.pain)).toBe(false);
    }
    for (const outcome of courseContent.learningOutcomes) {
      expect(isPlaceholder(outcome)).toBe(false);
    }
    for (const mod of courseContent.curriculumModules) {
      expect(isPlaceholder(mod.title)).toBe(false);
      expect(isPlaceholder(mod.summary)).toBe(false);
      for (const lesson of mod.lessons) {
        expect(isPlaceholder(lesson)).toBe(false);
      }
    }
    for (const item of courseContent.faq) {
      expect(isPlaceholder(item.question)).toBe(false);
      expect(isPlaceholder(item.answer)).toBe(false);
    }
  });

  it("has complete, non-empty content for every section", () => {
    expect(courseContent.authorityStats.length).toBeGreaterThan(0);
    expect(courseContent.audienceProfiles).toHaveLength(4);
    expect(courseContent.learningOutcomes.length).toBeGreaterThan(0);
    expect(courseContent.curriculumModules.length).toBeGreaterThan(0);
    for (const mod of courseContent.curriculumModules) {
      expect(mod.lessons.length).toBeGreaterThan(0);
    }
    expect(courseContent.methodology.length).toBeGreaterThan(0);
    expect(courseContent.faq.length).toBeGreaterThanOrEqual(4);
  });

  it("marks every authorityStats entry as unverified (pending real ABVCAP data)", () => {
    expect(courseContent.authorityStats.length).toBeGreaterThan(0);
    for (const stat of courseContent.authorityStats) {
      expect(stat.verified).toBe(false);
    }
  });

  it("covers the required FAQ objections", () => {
    const joined = courseContent.faq.map((f) => f.question.toLowerCase()).join(" | ");
    expect(joined).toMatch(/certificado/);
    expect(joined).toMatch(/dedica|tempo|carga/);
    expect(joined).toMatch(/mba|pós|pos-gradua/);
    expect(joined).toMatch(/reembolso|cancelamento/);
  });
});
