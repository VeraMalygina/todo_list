<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;


class CreateTaskDto
{
    #[Assert\NotBlank(message: 'Le titre est obligatoire.')]
    #[Assert\Length(
        min: 3,
        max: 255,
        minMessage: 'Le titre doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères.',
    )]
    private string $title;

    #[Assert\NotBlank(message: 'La description est obligatoire.')]
    #[Assert\Length(
        max: 300,
        maxMessage: 'La description ne peut pas dépasser {{ limit }} caractères.',
    )]
    private string $description;

    #[Assert\NotNull(message: 'La date est obligatoire.')]
    #[Assert\GreaterThan('today', message: 'La date doit etre dans le futur')]
    private ?\DateTimeImmutable $dueDate;

    public function __construct(
        string $title,
        string $description,
        ?\DateTimeImmutable $dueDate,
    )
    {
        $this->title = $title;
        $this->description = $description;
        $this->dueDate = $dueDate;

    }

    public function getTitle(): string 
    {
        return $this->title;
    }

    public function getDescription(): string 
    {
        return $this->description;
    }

    public function getDueDate(): \DateTimeImmutable 
    {
        return $this->dueDate;
    }

    
}