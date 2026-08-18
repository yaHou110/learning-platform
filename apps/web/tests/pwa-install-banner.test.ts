/**
 * Install-banner visibility rules (pure logic — no DOM needed):
 * show only on mobile browsers, when the app is not already installed,
 * and when the user has not dismissed the banner before.
 */
import { describe, expect, it } from "vitest";
import { shouldShowInstallBanner } from "../src/components/PwaInstallBanner";

describe("shouldShowInstallBanner", () => {
  it("shows on a mobile browser when not installed", () => {
    expect(
      shouldShowInstallBanner({ standalone: false, mobile: true, dismissed: false })
    ).toBe(true);
  });

  it("hides when the app is already installed (standalone)", () => {
    expect(
      shouldShowInstallBanner({ standalone: true, mobile: true, dismissed: false })
    ).toBe(false);
  });

  it("hides on desktop", () => {
    expect(
      shouldShowInstallBanner({ standalone: false, mobile: false, dismissed: false })
    ).toBe(false);
  });

  it("hides after the user dismissed it", () => {
    expect(
      shouldShowInstallBanner({ standalone: false, mobile: true, dismissed: true })
    ).toBe(false);
  });
});
