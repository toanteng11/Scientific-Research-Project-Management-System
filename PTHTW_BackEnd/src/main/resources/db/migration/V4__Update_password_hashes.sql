-- Refresh BCrypt hashes for Flyway seed users only (idempotent).
-- Default password: password123 — matches Spring BCryptPasswordEncoder(10).
UPDATE users
SET password_hash = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uXCf1O'
WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8);
