import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodTypeAny, z } from "zod";

/** Validates and transforms request data with a shared Zod schema. */
export class ZodValidationPipe<S extends ZodTypeAny> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      statusCode: 400,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
}
