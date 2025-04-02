import { fireEvent, screen } from "@testing-library/dom"
import Bills from "../containers/Bills.js"

describe("Given I am on Bills Page", () => {
    describe("When I click on an eye icon", () => {
        test("Then the modal should display the bill image", () => {
            document.body.innerHTML = `
        <div data-testid="icon-eye" data-bill-url="test.jpg"></div>
        <div id="modaleFile"><div class="modal-body"></div></div>
      `;

            $.fn.modal = jest.fn(); // Simule la fonction modal de Bootstrap

            const bills = new Bills({ document });
            const iconEye = screen.getByTestId("icon-eye");
            fireEvent.click(iconEye);

            expect(document.querySelector(".bill-proof-container img").src).toContain("test.jpg");
            expect($.fn.modal).toHaveBeenCalledWith('show');
        });
    });
});