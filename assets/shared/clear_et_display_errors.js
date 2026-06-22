//Le nettoyage du formulaire des erreurs.
export function clearErrors(form) {
    //On supprime les anciens message d'erreurs.
    form.querySelectorAll("[data-error-for]").forEach((el) => el.remove());

    //On retire l'ancien surlignage des inputs
    form.querySelectorAll("[data-has-error='true']").forEach((input) => {
        input.classList.remove("border-red-500", "focus:ring-red-500");
        input.removeAttribute("data-has-error");
        input.removeAttribute("aria-invalid");
    });
}

//On affiche les erreurs du formulaire.
export function displayErrors(form, errors) {
    clearErrors(form);

    Object.entries(errors).forEach(([field, message]) => {
        const input = form.querySelector(`[name="${field}"]`);

        if (!input) return;

        //Le surlignage de l'input
        input.classList.add("border-red-500", "focus:ring-red-500");
        input.setAttribute("data-has-error", "true");
        input.setAttribute("aria-invalid", "true");

        //On fait <p> avec le message d'erreur.
        const errorEl = document.createElement("p");
        errorEl.textContent = message;
        errorEl.className = "text-sm text-red-500";
        errorEl.setAttribute("data-error-for", field);

        input.insertAdjacentElement("afterend", errorEl);
    });
}
