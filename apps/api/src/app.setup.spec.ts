import { parseOrigins } from "./app.setup";

describe("parseOrigins", () => {
  it("defaults to the local web app", () => {
    expect(parseOrigins(undefined)).toEqual(["http://localhost:3000"]);
    expect(parseOrigins("")).toEqual(["http://localhost:3000"]);
  });

  it("accepts a single origin and strips a trailing slash", () => {
    expect(parseOrigins("https://salary.vercel.app/")).toEqual(["https://salary.vercel.app"]);
  });

  it("splits several origins and ignores blanks", () => {
    expect(parseOrigins("https://a.app, https://b.app ,,")).toEqual(["https://a.app", "https://b.app"]);
  });
});
