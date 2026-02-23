import "./app.css";

document.addEventListener("DOMContentLoaded", () => {
    const tasks = document.querySelectorAll('[draggable="true"]');
    const columns = document.querySelectorAll('[data-dropzone="true"]');

    const sheetOpen = document.querySelector("[data-sheet-open]");
    const sheetOverlay = document.querySelector("[data-sheet-overlay]");
    const sheetPanel = document.querySelector("[data-sheet-panel]");
    const sheetCloses = document.querySelectorAll("[data-sheet-close]");
    const form = document.getElementById("task-form");

    //Sheet-panel
    sheetOpen.addEventListener("click", () => {
        sheetOverlay.classList.remove("hidden");

        setTimeout(() => sheetPanel.classList.remove("translate-x-full"), 100);
    });

    sheetCloses.forEach((close) => {
        close.addEventListener("click", () => {
            sheetPanel.classList.add("translate-x-full");
            setTimeout(() => sheetOverlay.classList.add("hidden"), 700);
            clearErrors();
            form.reset();
        });
    });

    function clearErrors() {
        //On supprime les anciens message d'erreurs.
        document
            .querySelectorAll("[data-error-for]")
            .forEach((el) => el.remove());

        //On retire l'ancien surlignage des inputs
        document
            .querySelectorAll("[data-has-error='true']")
            .forEach((input) => {
                input.classList.remove("border-red-500", "focus:ring-red-500");
                input.removeAttribute("data-has-error");
                input.removeAttribute("aria-invalid");
            });
    }

    function displayErrors(errors) {
        clearErrors();

        Object.entries(errors).forEach(([field, message]) => {
            const input = document.querySelector(`[name="${field}"]`);

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

    //Envoi de la tache via Fetch et insertion dans le DOM
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const columnTodo = document.querySelector(
            '[data-status="todo"] [data-task-wrapper]',
        );
        const formData = new FormData(form);

        const response = await fetch("/tasks/create", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            displayErrors(data.errors);
            return console.log(data);
        }
        console.log(data)
        clearErrors();
        setTimeout(() => {
            columnTodo.insertAdjacentHTML("beforeend", data.html);
            updateCounters();
            form.reset();
            sheetPanel.classList.add("translate-x-full");
        }, 500);

        setTimeout(() => sheetOverlay.classList.add("hidden"), 700);
    });

    let draggedTask = null;
    let previousColumn = null;

    function updateCounters() {
        document.querySelectorAll('[data-dropzone="true"]').forEach((col) => {
            const content = col.querySelector(".flex.flex-col.gap-3");
            const count = content.querySelectorAll('[draggable="true"]').length;

            const counter = col.querySelector("[data-counter]");
            counter.textContent = count;
        });
    }

    tasks.forEach((task) => {
        task.addEventListener("dragstart", () => {
            draggedTask = task;
            previousColumn = draggedTask.closest("[data-task-wrapper]");
            task.classList.add("ring-2", "ring-blue-400/20");
        });

        task.addEventListener("dragend", () => {
            task.classList.add("animate-rollback");

            setTimeout(() => {
                task.classList.remove("animate-rollback");
            }, 450);
        });
    });

    columns.forEach((col) => {
        col.addEventListener("dragover", (event) => {
            event.preventDefault();
            col.classList.add("ring-2", "ring-blue-400/20");
        });

        col.addEventListener("dragleave", () => {
            col.classList.remove("ring-2", "ring-blue-400/20");
        });

        col.addEventListener("drop", () => {
            const content = col.querySelector(".flex.flex-col.gap-3");
            col.classList.remove("ring-2", "ring-blue-400/20");
            draggedTask.classList.remove("ring-2", "ring-blue-400/20");

            if (draggedTask) {
                content.appendChild(draggedTask);
                updateCounters();
            }

            const taskId = draggedTask.dataset.taskId;
            const newStatus = col.dataset.status;

            fetch("tasks/move", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify({
                    taskId: taskId,
                    status: newStatus,
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! Status: ${response.status}`,
                        );
                    }
                    return response;
                })
                .then(async (response) => {
                    const data = await response.json();
                    console.log("HTTP status:", response.status);
                    console.log("Body:", data);
                })
                .catch((err) => {
                    console.error("Error Fetch:", err);

                    // rollback
                    if (previousColumn && draggedTask) {
                        draggedTask.classList.add("animate-rollback");
                        draggedTask.classList.remove(
                            "ring-2",
                            "ring-blue-400/20",
                        );

                        setTimeout(() => {
                            draggedTask.classList.remove("animate-rollback");
                        }, 450);
                        previousColumn.appendChild(draggedTask);
                        updateCounters();
                    }
                    previousColumn = null;
                    draggedTask = null;
                });
        });
    });
    updateCounters();
});
