export function showConfirmationNotification({ message, type }) {
    let textConfirmationAndNotification =
        document.getElementById("modal-message");
    const modalIcon = document.getElementById("icon");
    const svg = document.querySelectorAll("#icon svg");
    const modalConfirmationNotification = document.querySelector(
        "[data-modal-confirmation-notification]",
    );

    textConfirmationAndNotification.textContent = message;

    if (type === "success") {
        modalIcon.classList.add("bg-green-600/35");
        document.querySelector(`[data-${type}]`).classList.remove("hidden");
    }

    if (type === "warning") {
        modalIcon.classList.add("bg-yellow-600/35");
        document.querySelector(`[data-${type}]`).classList.remove("hidden");
    }

    if (type === "error") {
        modalIcon.classList.add("bg-red-600/35");
        document.querySelector(`[data-${type}]`).classList.remove("hidden");
    }
    modalConfirmationNotification.classList.remove("hidden");

    setTimeout(() => {
        modalIcon.classList.remove("scale-0", "opacity-0", "blur-3xl");
        modalIcon.classList.add("scale-100", "opacity-100", "blur-0");
    }, 50);
    setTimeout(() => {
        modalConfirmationNotification.classList.add("hidden");
        modalIcon.classList.add("scale-0", "opacity-0", "blur-3xl");
        modalIcon.classList.remove(
            "scale-100",
            "opacity-100",
            "blur-0",
            "bg-green-600/35",
            "bg-red-600/35",
            "bg-yellow-600/35",
        );
        svg.forEach((svg) => svg.classList.add("hidden"));
    }, 3000);

    return;
}
