import { describe, it, expect } from "vitest";
import { courseContent } from "./curso";
import { isPlaceholder } from "@/lib/placeholder";

describe("courseContent pending data", () => {
  it("marks price, checkout URL and next cohort date as placeholders", () => {
    expect(isPlaceholder(courseContent.investment.price)).toBe(true);
    expect(isPlaceholder(courseContent.investment.checkoutUrl)).toBe(true);
    expect(isPlaceholder(courseContent.investment.nextCohortDate)).toBe(true);
    expect(isPlaceholder(courseContent.hero.checkoutUrl)).toBe(true);
  });

  it("marks remaining investment fields as placeholders", () => {
    expect(isPlaceholder(courseContent.investment.earlyBirdPrice)).toBe(true);
    expect(isPlaceholder(courseContent.investment.earlyBirdDeadline)).toBe(true);
    expect(isPlaceholder(courseContent.investment.seatsLimit)).toBe(true);
    expect(isPlaceholder(courseContent.investment.workloadHours)).toBe(true);
  });

  it("marks every faculty member's identifying fields as placeholders", () => {
    expect(courseContent.faculty.length).toBeGreaterThan(0);
    for (const member of courseContent.faculty) {
      expect(isPlaceholder(member.name)).toBe(true);
      expect(isPlaceholder(member.role)).toBe(true);
      expect(isPlaceholder(member.bio)).toBe(true);
      expect(isPlaceholder(member.photo)).toBe(true);
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
    expect(courseContent.community.title).not.toBe("");
    expect(courseContent.community.body).not.toBe("");
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
