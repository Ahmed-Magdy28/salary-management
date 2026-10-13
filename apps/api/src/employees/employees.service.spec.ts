import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@salary/db";
import { PrismaService } from "../prisma/prisma.service";
import { EmployeesService } from "./employees.service";

function knownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "test" });
}

const existing = {
  id: "e1",
  fullName: "Lena Fischer",
  email: "lena@acme.example",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "DE",
  currency: "EUR",
  salary: 72000,
  hireDate: new Date("2021-03-15T00:00:00Z"),
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function serviceWith(employee: Record<string, jest.Mock>): EmployeesService {
  return new EmployeesService({ client: { employee } } as unknown as PrismaService);
}

describe("EmployeesService", () => {
  it("maps a unique-email violation on create to 409", async () => {
    const service = serviceWith({ create: jest.fn().mockRejectedValue(knownError("P2002")) });
    await expect(
      service.create({
        fullName: "A",
        email: "a@acme.example",
        jobTitle: "x",
        department: "Finance",
        country: "DE",
        currency: "EUR",
        salary: 1,
        hireDate: "2020-01-01",
        status: "ACTIVE",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects a country change that leaves the old currency in place", async () => {
    const update = jest.fn();
    const service = serviceWith({ findUnique: jest.fn().mockResolvedValue(existing), update });
    await expect(service.update("e1", { country: "JP" })).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it("accepts a country change together with its currency", async () => {
    const update = jest.fn().mockResolvedValue({ ...existing, country: "JP", currency: "JPY" });
    const service = serviceWith({ findUnique: jest.fn().mockResolvedValue(existing), update });
    const result = await service.update("e1", { country: "JP", currency: "JPY" });
    expect(result.currency).toBe("JPY");
  });

  it("returns 404 when updating a missing employee", async () => {
    const service = serviceWith({ findUnique: jest.fn().mockResolvedValue(null) });
    await expect(service.update("nope", { salary: 5 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("maps a missing record on status change to 404", async () => {
    const service = serviceWith({ update: jest.fn().mockRejectedValue(knownError("P2025")) });
    await expect(service.setStatus("nope", "INACTIVE")).rejects.toBeInstanceOf(NotFoundException);
  });
});
