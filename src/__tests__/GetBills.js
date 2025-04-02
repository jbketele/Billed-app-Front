import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {

        test("Then it should fetch bills from the mock API GET", async () => {
            // Simuler le localStorage pour qu'un employé soit connecté
            Object.defineProperty(window, "localStorage", { value: localStorageMock });
            window.localStorage.setItem(
                "user",
                JSON.stringify({ type: "Employee" })
            );

            // Simuler l'affichage de la page Bills
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);

            // Initialiser le container Bills
            const billsContainer = new Bills({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            });

            // Attendre la récupération des données
            const fetchedBills = await billsContainer.getBills();

            // Vérifier que le contenu de factures
            expect(fetchedBills[0]).toHaveProperty("date");
            expect(fetchedBills[0].date).toMatch(/^\d{1,2} [A-Za-zéû.]+ \d{2}$/);

            // Vérifier l'affichage des factures
            await waitFor(() => screen.getByTestId("icon-window"));
            const windowIcon = screen.getByTestId("icon-window");
            expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
        });

        test("When getBills encounters an error while formatting dates, Then it should log the error and return the bill with the raw date", async () => {
            console.log = jest.fn(); // Mock console.log

            // Simuler un store avec une date invalide
            const store = {
                bills: jest.fn(() => ({
                    list: jest.fn(() =>
                        Promise.resolve([
                            { date: "invalid-date", status: "pending" } // Date invalide qui va provoquer une erreur
                        ])
                    )
                }))
            };

            const bills = new Bills({ document, store });

            // Exécuter getBills()
            const result = await bills.getBills();

            // Vérifier que console.log a bien été appelé
            expect(console.log).toHaveBeenCalledWith(
                expect.any(Error),
                "pour",
                { date: "invalid-date", status: "pending" }
            );

            // Vérifier que la facture retournée garde la date brute
            expect(result).toEqual([
                { date: "invalid-date", status: "En attente" }
            ]);
        });

    });
});