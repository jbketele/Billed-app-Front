import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = (e) => {
    console.log("handleChangeFile appelé !");

    const file = e.target.files[0];
    console.log("Fichier sélectionné :", file);

    // Liste des types de fichiers valides
    const validTypes = ["image/jpg", "image/jpeg", "image/png"];

    // Vérification du type de fichier
    if (!validTypes.includes(file.type)) {
      alert("Seuls les fichiers jpg, jpeg et png sont autorisés.");
      e.target.value = ""; // Réinitialiser le champ de fichier
      return;
    }

    const fileName = file.name;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", this.email);

    console.log("📤 Envoi du fichier à l'API...");

    this.store
      .bills()
      .create({ data: formData, headers: { noContentType: true } }) // Correction ici
      .then(({ fileUrl }) => {
        console.log("🖼️ fileUrl reçu après upload :", fileUrl); // Vérifie si l'URL est bien reçue
        this.fileUrl = fileUrl; // Stocke l'URL correctement
        this.fileName = file.name;
      })
      .catch(error => console.error(error));
  };
  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  updateBill = async (bill) => {
    console.log("Tentative d'update avec :", bill);

    if (!this.store) {
      console.error("this.store est undefined !");
      return; // Évite un appel inutile si le store est absent
    }

    this.store
      .bills()
      .update({ data: JSON.stringify(bill), selector: this.billId })
      .then(() => {
        console.log("Update réussi !");
        this.onNavigate(ROUTES_PATH['Bills']);
      })
      .catch(error => {
        if (error.response) {
          switch (error.response.status) {
            case 404:
              console.error("Erreur 404 : Ressource non trouvée");
              break;
            case 500:
              console.error("Erreur 500 : Erreur interne du serveur");
              break;
            default:
              console.error("Erreur inconnue :", error);
          }
        } else {
          console.error("Erreur dans updateBill :", error); // Log de secours si l'erreur n'a pas de response
        }
      });
  };
}