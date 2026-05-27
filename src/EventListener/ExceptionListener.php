<?php
namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Security\Core\Exception\ExceptionInterface;

class ExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        
       $exception = $event->getThrowable();

        // Séparation du traitement des erreurs entre Symfony Security et le listener API JSON
        // Base ExceptionInterface class for the Security component.
       if($exception instanceof ExceptionInterface) {
        return;
       }
       

       //Nous determinons le statut
        if($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
        } else {
            $statusCode = 500;
        }

        //Le text specifique pour chaque statut
        $message = match ($statusCode) {
            400 => 'Requête incorrecte',
            401 => 'Authentification requise',
            403 => 'Accès refusé',
            404 => 'Ressource introuvable',
            405 => 'Méthode non autorisée',
            default => 'Erreur interne du serveur',
        };


        //Type d'erreur
        $type = match ($statusCode) {
            400 => 'warning',
            401 => 'error',
            403 => 'error',
            404 => 'warning',
            405 => 'warning',
            default => 'error',
        };


        //Nous générons un JSON.
        $response = new JsonResponse([
            'status' => $statusCode,
            'message' => $message,
            'type' => $type,
        ], $statusCode);


        //Nous remplaçons la réponse. 
        $event->setResponse( $response);
    }
}