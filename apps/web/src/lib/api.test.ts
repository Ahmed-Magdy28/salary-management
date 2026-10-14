import { api } from "./api";

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

describe("api client requests", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(okResponse({}));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const headersOf = (callIndex = 0): Record<string, string> => fetchMock.mock.calls[callIndex][1].headers;

  it("sends no Content-Type on reads, so the browser skips the CORS preflight", async () => {
    await api.listEmployees({ page: "1" });
    await api.getOverview();
    await api.getFilterOptions();
    expect(headersOf(0)["Content-Type"]).toBeUndefined();
    expect(headersOf(1)["Content-Type"]).toBeUndefined();
    expect(headersOf(2)["Content-Type"]).toBeUndefined();
  });

  it("declares JSON on requests that send a body", async () => {
    await api.setEmployeeStatus("abc", "INACTIVE");
    expect(headersOf()["Content-Type"]).toBe("application/json");
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ status: "INACTIVE" }));
  });

  it("turns a failed request into an ApiError with field messages", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "Email already in use", errors: [{ path: "email", message: "This email is already in use" }] }),
    } as Response);
    await expect(api.getEmployee("x")).rejects.toMatchObject({ status: 409, fieldErrors: { email: "This email is already in use" } });
  });

  it("reports an unreachable server in plain language", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.getOverview()).rejects.toMatchObject({ status: 0, message: expect.stringContaining("Cannot reach the server") });
  });
});
