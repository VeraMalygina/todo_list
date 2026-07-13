import Sortable, { AutoScroll } from "sortablejs/modular/sortable.core.esm.js";
Sortable.mount(new AutoScroll());
import { showConfirmationNotification } from "../shared/confirmation_notification.js";
import {
    clearErrors,
    displayErrors,
} from "../shared/clear_et_display_errors.js";

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
    const taskWrapper = document.querySelectorAll("[data-task-wrapper]");
    const scrollBoard = document.querySelector("[data-board]");

    const modalDelete = document.getElementById("modal-delete");
    const closeModalDelete = document.querySelectorAll(
        "[data-close-modal-delete]",
    );
    const confirmModalDelete = document.querySelector("[data-confirm-modal]");
    const spinnerModalDelete = document.querySelector(
        "[data-spinner-modal-delete]",
    );

    const editModal = document.querySelector("[data-edit-overlay]");
    const closeEdit = document.querySelectorAll("[data-close-edit]");
    const formCreateTask = document.getElementById("task-form");
    const formEditModal = document.getElementById("edit-form");

    let currentTaskId = null;
    let currentCard = null;

    //Ouverture du panneau  Sheet-panel
    sheetOpen.addEventListener("click", () => {
        sheetOverlay.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        sheetPanel.style.display = "";

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

    //Envoi de la tache via Fetch et insertion dans le DOM
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const columnTodo = document.querySelector(
            '[data-status="todo"][data-task-wrapper]',
        );
        const formData = new FormData(form);

        try {
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
        } catch (error) {
            showConfirmationNotification({
                message: "Serveur temporairement indisponible.",
                type: "error",
            });
        }
    });

    function updateCounters() {
        document.querySelectorAll("[data-task-wrapper]").forEach((col) => {
            const count = col.querySelectorAll('[data-task="card"]').length;

            const column = col.closest("[data-column]");
            const counter = column.querySelector("[data-counter]");
            counter.textContent = count;
        });
    }
    updateCounters();

    taskWrapper.forEach((wrapper) => {
        Sortable.create(wrapper, {
            group: "tasks",
            sort: true,
            animation: 150,

            draggable: '[data-task="card"]',
            handle: "[data-drag-handle]",

            scroll: scrollBoard,
            bubbleScroll: false,
            scrollSensitivity: 100,
            scrollSpeed: 10,

            delayOnTouchOnly: true,
            delay: 180,
            touchStartThreshold: 5,

            forceFallback: true,

            fallbackClass: "task-fallback", // Class name for the cloned DOM Element when using forceFallback
            fallbackOnBody: true, // Appends the cloned DOM Element into the Document's Body
            fallbackTolerance: 3, // Specify in pixels how far the mouse should move before it's considered as a drag.

            ghostClass: "task-ghost",
            chosenClass: "task-chosen",
            dragClass: "task-drag",

            onEnd: function (evt) {
                const task = evt.item; // dragged HTMLElement

                const newColumn = evt.to; // target list
                const previousColumn = evt.from; // previous list
                const oldIndex = evt.oldIndex; // element's old index within old parent

                const oldStatus =
                    previousColumn.closest("[data-status]").dataset.status;
                const newStatus =
                    newColumn.closest("[data-status]").dataset.status;

                if (newColumn === previousColumn) {
                    return;
                }

                const taskId = task.dataset.taskId;

                function rollbackTask(task, previousColumn, oldIndex) {
                    task.classList.add("animate-rollback");

                    const cards =
                        previousColumn.querySelectorAll('[data-task="card"]');

                    const referenceCard = cards[oldIndex] || null;

                    previousColumn.insertBefore(task, referenceCard);

                    setTimeout(() => {
                        task.classList.remove("animate-rollback");
                    }, 450);
                }

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
                            rollbackTask(task, previousColumn, oldIndex);
                            updateCounters();
                            return;
                        }
                        updateCounters();
                        return response;
                    })
                    .catch(() => {
                        showConfirmationNotification({
                            message: "Serveur temporairement indisponible.",
                            type: "error",
                        });
                        rollbackTask(task, previousColumn, oldIndex);
                        updateCounters();
                    });

                if (newColumn) {
                    scrollBoard.scrollTo({
                        left:
                            newColumn.offsetLeft -
                            (scrollBoard.clientWidth - newColumn.offsetWidth),
                        behavior: "auto",
                    });
                }
            },
        });
    });

    //Ouverture de ModalDelete
    document.addEventListener("click", (e) => {
        const btnDelete = e.target.closest('[data-action="delete-task"]');
        if (!btnDelete) return;

        const card = btnDelete.closest('[data-task="card"]');
        currentCard = card;
        currentTaskId = card.dataset.taskId;
       
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        const modalDelete = document.getElementById("modal-delete");
        modalDelete.classList.remove("hidden");
    });

    //Fermeture de ModalDelete
    closeModalDelete.forEach((close) => {
        close.addEventListener("click", () => {
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
            modalDelete.classList.add("hidden");
        });
    });

    //Une suppression de tache
    confirmModalDelete.addEventListener("click", async () => {
        modalDelete.classList.add("hidden");
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
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
            confirmModalDelete.disabled = false;
            spinnerModalDelete.classList.add("hidden");
            currentTaskId = null;
            currentCard = null;
           
        }
    });

    // Ouverture de EditModal
    document.addEventListener("mousedown", (e) => {
        const btnEditTask = e.target.closest("[data-edit]");

        if (!btnEditTask) return;

        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

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
            setTimeout(() => editModal.classList.add("hidden"), 5000);
            updateCounters();
        } catch (error) {
            showConfirmationNotification({
                message: "Serveur temporairement indisponible.",
                type: "error",
            });
        } finally {
            btnConfirmEdit.disabled = false;
            spinnerEdit.classList.add("hidden");
        }
    });

    //Fermeture de EditModal
    closeEdit.forEach((close) => {
        close.addEventListener("click", () => {
            clearErrors(formEditModal);
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
            editModal.classList.add("hidden");
        });
    });
});
