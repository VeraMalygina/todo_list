<?php

namespace App\Controller;

use App\Repository\TasksRepository;
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
        TasksRepository $tasksRepository
        ): Response
    {
        $todoTasks = $tasksRepository->findBy(['status' => 'todo']);

        $inProgressTasks = $tasksRepository->findBy(['status' => 'in_progress']);

        $doneTasks = $tasksRepository->findBy(['status' => 'done']);
        
        return $this->render('tasks/index.html.twig', [
            'todoTasks' => $todoTasks,
            'inProgressTasks' => $inProgressTasks,
            'doneTasks' => $doneTasks
        ]);
        
    }

    #[Route('/tasks/move', name: 'task_move', methods: ['POST'])]
    public function move(
        Request $request,
        TasksRepository $tasksRepository,
        EntityManagerInterface $em
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $task = $tasksRepository->find($data['taskId']);
        
        if(!$task) {
            return new JsonResponse(['error' => 'Task not found'] , 404);
        };
        
        
        $task->setStatus($data['status']);
        $em->flush();
        
        return new JsonResponse(['success' => true]);
    }
}
