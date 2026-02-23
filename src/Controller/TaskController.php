<?php

namespace App\Controller;

use App\Dto\CreateTaskDto;
use App\Repository\TaskRepository;
use App\Entity\Task;
use App\Repository\UserRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;


final class TaskController extends AbstractController
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


    #[Route('/tasks/create', name: 'task_create', methods: ['POST'])]
    public function createTask(
        Request $request,
        ValidatorInterface $validator,
        EntityManagerInterface $em,
        UserRepository $user

    ): JsonResponse
    {
        // CSRF
        if(!$this->isCsrfTokenValid('create_task', $request->request->get("_token"))) {
            return new JsonResponse(['error' => 'Invalid CSRF token'], 403);
        };
        
        
        $dueDate = $request->request->get('dueDate'); 

        // Data Transfer Object pour Validator
        $dto = new CreateTaskDto(
            $request->request->get('title'),
            $request->request->get('description'),
            !empty($dueDate) ? new DateTimeImmutable($dueDate) : null 
        );

        // Validator
        $errors = $validator->validate($dto);
        

        if(count($errors) > 0) {
           $formattedErrors = [];
           foreach ($errors as $error) {
            $field = $error->getPropertyPath();
            $formattedErrors[$field] = $error->getMessage();
           }
           return new JsonResponse([ 'errors' => $formattedErrors], 422);
        }

        $task = new Task();
        $task->setTitle($dto->getTitle());
        $task->setDescription($dto->getDescription());
        $task->setDueDate($dto->getDueDate());
        $task->setStatus('todo');

        $user = $user->find(1);

        $task->setAuthor($user);

        //Doctrine
        $em->persist($task);
        $em->flush();

        $html = $this->renderView('components/_card.html.twig', [
            'oneTask' =>  $task
        ]);

        return new JsonResponse(['html' =>  $html]);
        
    }
}
