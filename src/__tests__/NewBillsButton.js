import { fireEvent, screen } from "@testing-library/dom"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
    describe("When I click on the 'New Bill' button", () => {
        test("Then it should navigate to the NewBill page", () => {
            //Simuler un employé connecté
            Object.defineProperty(window, 'localStorage', { value: localStorageMock })
            window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
            //Simuler le bouton 'New Bill'
            document.body.innerHTML = `<button data-testid="btn-new-bill"></button>`;
            //Simuler la navigation
            const onNavigate = jest.fn();
            const bills = new Bills({ document, onNavigate });
            //Simuler le clic sur le bouton 'New Bill
            const buttonNewBill = screen.getByTestId("btn-new-bill");
            fireEvent.click(buttonNewBill);
            //Vérifier la navigation
            expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
        });
    });
});