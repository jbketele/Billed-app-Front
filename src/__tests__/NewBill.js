/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

jest.mock("../app/store", () => mockStore);

// Simuler localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(() => JSON.stringify({ email: "test@employee.com" })),
    setItem: jest.fn(),
  },
  writable: true,
});

// Simuler l'alerte
window.alert = jest.fn();
console.error = jest.fn(); // Pour tester les erreurs

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form elements should be rendered", () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });
  });

  describe("When I select a file", () => {
    test("Then it should upload a valid file", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["content"], "photo.jpg", { type: "image/jpg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => expect(newBill.fileUrl).toMatch(/localhost:3456\/images\/test.jpg/));
    });

    test("Then it should reject an invalid file", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["content"], "document.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Attendre que l'alerte soit appelée
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers jpg, jpeg et png sont autorisés.");
      });

      // Vérifiez que le champ a été vidé
      expect(fileInput.value).toBe("");
    });
  });

  describe("When I submit the form", () => {
    test("Then it should create a new bill with correct data", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const expenseNameInput = screen.getByTestId("expense-name");
      const amountInput = screen.getByTestId("amount");
      const datepickerInput = screen.getByTestId("datepicker");
      const vatInput = screen.getByTestId("vat");
      const pctInput = screen.getByTestId("pct");
      const commentaryInput = screen.getByTestId("commentary");

      fireEvent.input(expenseNameInput, { target: { value: "Travel" } });
      fireEvent.input(amountInput, { target: { value: "100" } });
      fireEvent.input(datepickerInput, { target: { value: "2025-03-19" } });
      fireEvent.input(vatInput, { target: { value: "10" } });
      fireEvent.input(pctInput, { target: { value: "20" } });
      fireEvent.input(commentaryInput, { target: { value: "Business trip" } });


      const fileInput = screen.getByTestId("file");
      const file = new File(["content"], "facture.jpg", { type: "image/jpg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Attendre que l'URL du fichier soit définie
      await waitFor(() => expect(newBill.fileUrl).not.toBeNull());

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(newBill.fileUrl).toMatch(/\/images\/test.jpg$/); // Vérifie la fin de l'URL
      });
    });

    test("Then it should log an error if store is undefined", () => {
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null, // Simule un store non défini
        localStorage: window.localStorage,
      });

      newBill.updateBill({});

      expect(console.error).toHaveBeenCalledWith("this.store est undefined !");
    });

    test("Then it should handle an API error in updateBill", async () => {
      const mockStore = {
        bills: () => ({
          update: jest.fn(() => Promise.reject(new Error("Erreur API"))), // Simule une erreur API
        }),
      };

      console.error = jest.fn(); // Mock de console.error

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore, // Vérifie que le store est bien défini
        localStorage: window.localStorage,
      });

      await expect(newBill.updateBill({})).resolves.toBeUndefined(); // Assurez-vous que l'attente fonctionne bien

      expect(console.error).toHaveBeenCalledWith("Erreur dans updateBill :", expect.any(Error));
    });

    test("Then it should log an error if the file upload fails", async () => {
      const mockStore = {
        bills: () => ({
          create: jest.fn(() => Promise.reject(new Error("Erreur 500"))), // Simule une erreur API
        }),
      };

      console.error = jest.fn(); // On mock console.error

      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["content"], "facture.jpg", { type: "image/jpg" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled(); // Vérifie que l'erreur est bien loguée
      });
    });
  });

  describe("When the API fails", () => {
    test("Then it should log a 404 error if the API returns 'Not Found'", async () => {
      const mockStore = {
        bills: () => ({
          update: jest.fn(() => Promise.reject({ response: { status: 404 } })),
        }),
      };

      console.error = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      await expect(newBill.updateBill({})).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith("Erreur 404 : Ressource non trouvée");
    });

    test("Then it should log a 500 error if the API returns 'Internal Server Error'", async () => {
      const mockStore = {
        bills: () => ({
          update: jest.fn(() => Promise.reject({ response: { status: 500 } })),
        }),
      };

      console.error = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      await expect(newBill.updateBill({})).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith("Erreur 500 : Erreur interne du serveur");
    });
  });
});