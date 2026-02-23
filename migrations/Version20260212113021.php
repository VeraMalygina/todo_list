<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260212113021 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE users RENAME COLUMN role TO roles');
        $this->addSql('ALTER TABLE users ALTER COLUMN roles TYPE JSON USING roles::json');

    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE users ALTER COLUMN roles TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE "users" RENAME COLUMN roles TO role');
    }
}
