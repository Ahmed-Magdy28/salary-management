import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  const pipe = new ZodValidationPipe(z.object({ salary: z.number().positive("Must be positive") }));

  it("returns parsed data when valid", () => {
    expect(pipe.transform({ salary: 5 })).toEqual({ salary: 5 });
  });

  it("throws a 400 with field-level errors when invalid", () => {
    try {
      pipe.transform({ salary: -1 });
      throw new Error("expected to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as { errors: { path: string; message: string }[] };
      expect(body.errors).toEqual([{ path: "salary", message: "Must be positive" }]);
    }
  });
});
