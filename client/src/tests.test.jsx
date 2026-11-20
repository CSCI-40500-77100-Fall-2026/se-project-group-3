import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StarRating from "./components/StarRating.jsx";

describe("StarRating component tests", () => {
  it("StarRating renders ten stars", () => {
    const html = renderToStaticMarkup(
      <StarRating value={3.2} />
    );

    expect((html.match(/class="star"/g) || []).length).toBe(10);
  });

  it("StarRating displays the correct difficulty label", () => {
    const html = renderToStaticMarkup(
      <StarRating value={3.2} />
    );

    expect(html).toContain('aria-label="3.20 star difficulty"');
  });

  it("StarRating has no filled stars at zero difficulty", () => {
    const html = renderToStaticMarkup(
      <StarRating value={0} />
    );

    expect(html).not.toContain('class="star__filled"');
  });
});