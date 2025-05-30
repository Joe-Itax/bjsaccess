// const BASE_API_URL = "https://bjsaccess-back-office.vercel.app/api";
const BASE_API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm");
  const contactName = document.getElementById("contactName");
  const contactEmail = document.getElementById("contactEmail");
  const contactSubject = document.getElementById("contactSubject");
  const contactMessage = document.getElementById("contactMessage");
  const submitContactButton = document.getElementById("submitContact");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!submitContactButton) {
        alert("submitContactButton n'existe pas.");
      }

      const name = contactName.value.trim();
      const email = contactEmail.value.trim();
      const subject = contactSubject.value.trim();
      const message = contactMessage.value.trim();

      if (!name || !email || !subject || !message) {
        alert("Veuillez remplir tous les champs du formulaire.");
        return;
      }

      submitContactButton.disabled = true;
      submitContactButton.textContent = "Envoi en cours...";

      try {
        const response = await fetch(`${BASE_API_URL}/contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, subject, message }),
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || "Message envoyé avec succès !");
          contactForm.reset();
        } else {
          alert(data.message || "Erreur lors de l'envoi du message.");
        }
      } catch (error) {
        console.error("Erreur réseau ou inattendue:", error);
        alert("Une erreur est survenue lors de l'envoi du message.");
      } finally {
        submitContactButton.disabled = false;
        submitContactButton.textContent = "Envoyer le message";
      }
    });
  }
});
