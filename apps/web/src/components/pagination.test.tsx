import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./pagination";

const setup = (props: Partial<React.ComponentProps<typeof Pagination>> = {}) => {
  const onPageChange = jest.fn();
  const onPageSizeChange = jest.fn();
  render(<Pagination page={1} pageSize={50} total={412} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} {...props} />);
  return { onPageChange, onPageSizeChange };
};

describe("Pagination", () => {
  it("shows the visible range, total and page count", () => {
    setup();
    expect(screen.getByText("Showing 1-50 of 412")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 9")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last", () => {
    setup();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("shows the partial last page range", () => {
    setup({ page: 9 });
    expect(screen.getByText("Showing 401-412 of 412")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("reports page and page size changes", async () => {
    const { onPageChange, onPageSizeChange } = setup({ page: 2 });
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await userEvent.selectOptions(screen.getByLabelText("Rows per page"), "100");
    expect(onPageSizeChange).toHaveBeenCalledWith(100);
  });

  it("copes with no results", () => {
    setup({ total: 0 });
    expect(screen.getByText("Showing 0-0 of 0")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });
});
