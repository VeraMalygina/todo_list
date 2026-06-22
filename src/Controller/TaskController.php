<?php

namespace App\Controller;

use App\Dto\CreateTaskDto;
use App\Repository\TaskRepository;
use App\Entity\Task;

use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Validator\Validator\ValidatorInterface;



final class TaskController extends AbstractController
{
    #[Route('/', name: 'app_tasks')]
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
            'doneTasks' => $doneTasks,
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
            throw new NotFoundHttpException();
            
        };

        if(!$task) {
            throw new UserNotFoundException();
            
        };


        if($task->getAuthor() !== $this->getUser()) {
            throw new AccessDeniedHttpException();
        }
        
        
        $task->setStatus($data['status']);
        $em->flush();
        
        return new JsonResponse(['message' => true]);
    }

    #[Route('/task/{id}/edit', name: 'task_edit', methods: ['POST','PATCH'])]
    public function taskEdit(
        Task $task,
        Request $request, 
        ValidatorInterface $validator,
        EntityManagerInterface $em
        ): JsonResponse
    {
        if($task->getAuthor() !== $this->getUser()) {
            throw new AccessDeniedHttpException();
        }

        if (!$this->isCsrfTokenValid('edit-task', $request->request->get('_token'))) {
            throw new AccessDeniedHttpException();
        };
        
       

        $dueDate = $request->request->get('dueDate');

        $dto = new CreateTaskDto(
            $request->request->get('title'),
            $request->request->get('description'),
            !empty($dueDate) ? new DateTimeImmutable($dueDate) : null,

        );

        $errors = $validator->validate($dto);

       

        if(count($errors) > 0) {
            $formattedErrors = [];
            foreach($errors as $error) {
                $field = $error->getPropertyPath();
                $formattedErrors[$field] = $error->getMessage();
                dump( $formattedErrors);
            }
            return new JsonResponse(['errors' => $formattedErrors], 422);
        }
         
        
        $task->setTitle($dto->getTitle());
        $task->setDescription($dto->getDescription());
        $task->setDueDate($dto->getDueDate());
        

        
        $em->flush();
        
        $html = $this->renderView('components/_card.html.twig', [
            'oneTask' => $task,
        ]);
        
       return new JsonResponse([
            'message' => 'Votre tâche a été mise à jour avec succès.',
            'type' => 'success',
            'html' => $html,
        ], 200);
        
    }


    #[Route('/tasks/create', name: 'task_create', methods: ['POST'])]
    public function createTask(
        Request $request,
        ValidatorInterface $validator,
        EntityManagerInterface $em,
        

    ): JsonResponse
    {
        // CSRF
        if(!$this->isCsrfTokenValid('create_task', $request->request->get("_token"))) {
             throw new AccessDeniedHttpException();
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

        $user = $this->getUser();
        if(!$user) {
            throw $this->createAccessDeniedException();
        }

        $task->setAuthor($user);

        //Doctrine
        $em->persist($task);
        $em->flush();
        

        $html = $this->renderView('components/_card.html.twig', [
            'oneTask' =>  $task
        ]);

        return new JsonResponse(['html' =>  $html]);
        
    }

    #[Route('/tasks/{id}/delete', name: 'task_delete', methods: ['DELETE'])]
    public function deleteTask(
        Task $task,
        EntityManagerInterface $em
        ): JsonResponse
    {

        if($task->getAuthor() !== $this->getUser()) {
            throw new AccessDeniedHttpException();
        }

        $em->remove($task);
       
        $em->flush();

       return new JsonResponse(['message' => 'Votre tâche a été supprimée avec succès',
                                'type' => 'success'
        ], 200);
        
    }
}
