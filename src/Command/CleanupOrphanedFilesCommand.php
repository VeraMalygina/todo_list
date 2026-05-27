<?php

namespace App\Command;

use App\Repository\UserRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;


#[AsCommand(
    name: 'cleanup-orphaned-files',
    description: 'Vérifie les images du dossier et supprime celles qui ne sont plus dans la base de données.',
)]
class CleanupOrphanedFilesCommand extends Command
{
    public function __construct(
        private string $avatarsDirectory,
        private UserRepository $userRepository,
    )
    {
        parent::__construct();
    }

    

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        //On recupere tous les utilisateus de la base de donnees
        $users = $this->userRepository->findAll();

        $avatarsInBD = [];

        foreach ($users as $user ) {
            if( $user->getAvatar()) {
                $avatarsInBD[] =  $user->getAvatar();

            }
        }
       

        //Nous lisons le dossier des avatars
        $files = scandir($this->avatarsDirectory);
        foreach ( $files as $file) {
            //On egnore les fichiers sisteme
            if($file === '.' || $file === '..') {
                continue;
            }

            //on delite les fichiers qui ne sont plus dans la base de donnees
            if(!in_array($file, $avatarsInBD)) {
                unlink($this->avatarsDirectory. '/' . $file);
                $output->writeln('Deleted file:' . $file);
            }

        }
 
        return Command::SUCCESS;
    }
}
