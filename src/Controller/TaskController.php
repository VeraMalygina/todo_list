<?php

namespace App\Controller;

use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class TasksController extends AbstractController
{
    #[Route('/tasks', name: 'app_tasks')]
    public function index(
        TaskRepository $taskRepository
        ): Response
    {
        $todoTasks = $taskRepository->findBy(['status' => 'todo']);

        $inProgressTasks = $taskRepository->findBy(['status' => 'in_progress']);

        $doneTasks = $taskRepository->findBy(['status' => 'done']);
        
        return $this->render('tasks/index.html.twig', [
            'todoTasks' => $todoTasks,
            'inProgressTasks' => $inProgressTasks,
            'doneTasks' => $doneTasks
        ]);
        
    }

    #[Route('/tasks/move', name: 'task_move', methods: ['POST'])]
    public function move(
        Request $request,
        TaskRepository $taskRepository,
        EntityManagerInterface $em
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $task = $taskRepository->find($data['taskId']);
        
        if(!$task) {
            return new JsonResponse(['error' => 'Task not found'] , 404);
        };
        
        
        $task->setStatus($data['status']);
        $em->flush();
        
        return new JsonResponse(['success' => true]);
    }
}
