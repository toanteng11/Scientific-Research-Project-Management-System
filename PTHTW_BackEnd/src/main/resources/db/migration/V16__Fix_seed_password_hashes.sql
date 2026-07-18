-- Correct the invalid BCrypt hash shipped in V2/V4 without overwriting passwords
-- that have already been changed by a user.
UPDATE users
SET password_hash = '$2a$10$VUY4d7CecaC55J9k3A7N0.miETgBoMbJ/dIyJO.JjsB4N1FZGBNXm',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8)
  AND password_hash = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uXCf1O';
