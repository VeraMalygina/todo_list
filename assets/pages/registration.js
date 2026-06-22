import { showConfirmationNotification } from "../shared/confirmation_notification.js";

document.addEventListener("DOMContentLoaded", () => {
    const pageRegistration = document.querySelector(
        '[data-page="registration"]',
    );

    if (!pageRegistration) {
        return;
    }

    const avatarInput = document.querySelector("[data-avatar='avatar']");

    const registrationForm = document.querySelector("#registration-form");

    const maxSize = Number(avatarInput.dataset.maxSize);

    const maxSizeInMb = maxSize / 1024 / 1024; //Convertir les octets en megaoctets

    //Validation de la taille d'avatar
    function validateFileSize() {
        const file = avatarInput.files[0];

        if (!file) {
            return true;
        }

        if (file.size > maxSize) {
            showConfirmationNotification({
                message: `Le fichier est trop volumineux . La taille maximale est de ${maxSizeInMb} MB.`,
                type: "error",
            });
            avatarInput.value = "";
            return false;
        }
        return true;
    }
    avatarInput.addEventListener("change", validateFileSize);
});
