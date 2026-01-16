import "./app.css";

const tasks = document.querySelectorAll('[draggable="true"]');
const columns = document.querySelectorAll('[data-dropzone="true"]');

let draggedTask = null;

tasks.forEach((task) => {
    task.addEventListener("dragstart", () => {
        draggedTask = task;
        task.classList.add("ring-2", "ring-blue-400/20");
    });

    task.addEventListener("dragend", () => {
        draggedTask = null;
        task.classList.remove("ring-2", "ring-blue-400/20");
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

        if (draggedTask) {
            content.appendChild(draggedTask);
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
        .then(response => {
            if(!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            return response;
        })
        .then(async (response) => {
            const data = await response.json();
            console.log("HTTP status:", response.status);
            console.log("Body:", data);
        })
        .catch(err => {
            console.error('Error Fetch:', err);
            
        });
    });
});
