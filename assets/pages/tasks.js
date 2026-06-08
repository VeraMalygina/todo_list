document.addEventListener("DOMContentLoaded", () => {
    const pageTasks = document.querySelector('[data-page="tasks"]');

    if (!pageTasks) {
        return;
    }

    const columns = document.querySelectorAll('[data-dropzone="true"]');

    const sheetOpen = document.querySelector("[data-sheet-open]");
    const sheetOverlay = document.querySelector("[data-sheet-overlay]");
    const sheetPanel = document.querySelector("[data-sheet-panel]");
    const sheetCloses = document.querySelectorAll("[data-sheet-close]");
    const form = document.getElementById("task-form");

    const modalDelete = document.getElementById("modal-delete");
    const closeModalDelete = document.querySelectorAll(
        "[data-close-modal-delete]",
    );
    const confirmModalDelete = document.querySelector("[data-confirm-modal]");
    const spinnerModalDelete = document.querySelector(
        "[data-spinner-modal-delete]",
    );
    const modalIcon = document.getElementById("icon");
    const svg = document.querySelectorAll("#icon svg");

    let currentCard = null;
    let currentTaskId = null;
    const modalConfirmationNotification = document.querySelector(
        "[data-modal-confirmation-notification]",
    );
    const editModal = document.querySelector("[data-edit-overlay]");
    const closeEdit = document.querySelectorAll("[data-close-edit]");
    const formCreateTask = document.getElementById("task-form");
    const formEditModal = document.getElementById("edit-form");
    let textConfirmationAndNotification =
        document.getElementById("modal-message");

    //Ouverture du panneau  Sheet-panel
    sheetOpen.addEventListener("click", () => {
        sheetOverlay.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        setTimeout(() => sheetPanel.classList.remove("translate-x-full"), 100);
    });

    // Fermeture du panneau Sheet-panel
    sheetCloses.forEach((close) => {
        close.addEventListener("click", () => {
            sheetPanel.classList.add("translate-x-full");
            setTimeout(() => sheetOverlay.classList.add("hidden"), 700);
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
            clearErrors(formCreateTask);
            form.reset();
        });
    });

    function clearErrors(form) {
        //On supprime les anciens message d'erreurs.
        form.querySelectorAll("[data-error-for]").forEach((el) => el.remove());

        //On retire l'ancien surlignage des inputs
        form.querySelectorAll("[data-has-error='true']").forEach((input) => {
            input.classList.remove("border-red-500", "focus:ring-red-500");
            input.removeAttribute("data-has-error");
            input.removeAttribute("aria-invalid");
        });
    }

    function displayErrors(form, errors) {
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
            if (data.errors) {
                displayErrors(formCreateTask, data.errors);
            } else {
                showConfirmationNotification({
                    message: data.message,
                    type: data.type,
                });
            }

            return;
        }

        document.body.classList.remove("overflow-hidden");
        document.documentElement.classList.remove("overflow-hidden");
        clearErrors(formCreateTask);
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

    //event delegation
    document.addEventListener("dragstart", (e) => {
        const task = e.target.closest('[draggable="true"]');
        if (!task) return;

        draggedTask = task;
        previousColumn = draggedTask.closest("[data-task-wrapper]");
        task.classList.add("ring-2", "ring-blue-400/20");
    });

    //event delegation
    document.addEventListener("dragend", (e) => {
        const task = e.target.closest('[draggable="true"]');

        if (!task) return;

        task.classList.add("animate-rollback");

        setTimeout(() => {
            task.classList.remove("animate-rollback");
        }, 450);
    });

    function rollbackTask() {
        // rollback
        if (previousColumn && draggedTask) {
            draggedTask.classList.add("animate-rollback");
            draggedTask.classList.remove("ring-2", "ring-blue-400/20");

            const taskElement = draggedTask;

            setTimeout(() => {
                taskElement.classList.remove("animate-rollback");
            }, 450);
            previousColumn.appendChild(taskElement);
            updateCounters();
        }
    }

    //Surbrillance des cartes, des colonnes et envoi des donnees au serveur lors du changement de statut d'une carte.
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

            fetch("/tasks/move", {
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
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        showConfirmationNotification({
                            message: data.message,
                            type: data.type,
                        });
                        rollbackTask();
                        return;
                    }
                    return response;
                })
                .catch(() => {
                    showConfirmationNotification({
                        message: "Serveur temporairement indisponible.",
                        type: "error",
                    });

                    rollbackTask();
                    previousColumn = null;
                    draggedTask = null;
                });
        });
    });
    updateCounters();

    //Ouverture de ModalDelete
    document.addEventListener("mousedown", (e) => {
        const btnDelete = e.target.closest('[data-action="delete-task"]');
        if (!btnDelete) return;

        const card = btnDelete.closest('[data-task="card"]');
        currentCard = card;
        currentTaskId = card.dataset.taskId;

        const modalDelete = document.getElementById("modal-delete");
        modalDelete.classList.remove("hidden");
    });

    //Fermeture de ModalDelete
    closeModalDelete.forEach((close) => {
        close.addEventListener("click", () => {
            modalDelete.classList.add("hidden");
        });
    });

    function showConfirmationNotification({ message, type }) {
        modalDelete.classList.add("hidden");
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

    //Une suppression de tache
    confirmModalDelete.addEventListener("click", async () => {
        confirmModalDelete.disabled = true;
        spinnerModalDelete.classList.remove("hidden");
        try {
            const response = await fetch(`/tasks/${currentTaskId}/delete`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                showConfirmationNotification({
                    message: errorData.message,
                    type: errorData.type,
                });
                return;
            }

            const data = await response.json();

            currentCard.remove();
            showConfirmationNotification({
                message: data.message,
                type: data.type,
            });

            updateCounters();
        } catch (error) {
            showConfirmationNotification({
                message: "Serveur temporairement indisponible.",
                type: "error",
            });
            return;
        } finally {
            confirmModalDelete.disabled = false;
            spinnerModalDelete.classList.add("hidden");
        }
    });

    // Ouverture de EditModal
    document.addEventListener("mousedown", (e) => {
        const btnEditTask = e.target.closest("[data-edit]");

        if (!btnEditTask) return;

        const currentEditTask = btnEditTask.closest('[data-task="card"]');
        const id = currentEditTask.dataset.taskId;
        const title = currentEditTask.dataset.title;
        const description = currentEditTask.dataset.description;
        const dueDate = currentEditTask.dataset.dueDate;

        editModal.classList.remove("hidden");

        formEditModal.taskId.value = id;
        formEditModal.title.value = title;
        formEditModal.description.value = description;
        formEditModal.dueDate.value = dueDate;
    });

    //Une modification de tache
    formEditModal.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btnConfirmEdit = document.querySelector("[data-confirm-edit]");
        const spinnerEdit = document.querySelector("[data-spinner-edit]");

        const idTask = formEditModal.taskId.value;

        btnConfirmEdit.disabled = true;
        spinnerEdit.classList.remove("hidden");

        const formData = new FormData(formEditModal);

        try {
            const response = await fetch(`/task/${idTask}/edit`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const responseErrorsOrNotification = await response.json();

                if (responseErrorsOrNotification.errors) {
                    console.log(responseErrorsOrNotification);
                    displayErrors(
                        formEditModal,
                        responseErrorsOrNotification.errors,
                    );
                } else {
                    showConfirmationNotification({
                        message: responseErrorsOrNotification.message,
                        type: responseErrorsOrNotification.type,
                    });
                }

                return;
            }

            const data = await response.json();

            clearErrors(formEditModal);
            showConfirmationNotification({
                message: data.message,
                type: data.type,
            });

            const idCard = document.querySelector(`[data-task-id="${idTask}"]`);
            idCard.outerHTML = data.html;

            updateCounters();
        } catch (error) {
            showConfirmationNotification({
                message: "Serveur temporairement indisponible.",
                type: "error",
            });
        } finally {
            btnConfirmEdit.disabled = false;
            spinnerEdit.classList.add("hidden");

            // setTimeout(()=> editModal.classList.add("hidden"), 700);
        }
    });

    //Fermeture de EditModal
    closeEdit.forEach((close) => {
        close.addEventListener("click", () => {
            editModal.classList.add("hidden");
        });
    });
});
