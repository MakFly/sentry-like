<?php

declare(strict_types=1);

namespace App\Exception\Database;

use App\Exception\DomainException;

/**
 * Thrown when a database constraint is violated.
 */
final class ConstraintViolationException extends DomainException
{
    public function __construct(
        string $table,
        string $constraint,
        string $value,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            "Constraint '{constraint}' violated on table '{table}' for value: {value}",
            [
                'table' => $table,
                'constraint' => $constraint,
                'value' => $value,
            ],
            0,
            $previous
        );
    }
}
