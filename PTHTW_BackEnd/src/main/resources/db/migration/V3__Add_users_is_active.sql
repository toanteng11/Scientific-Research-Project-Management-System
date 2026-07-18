-- Align users table with JPA User.isActive (account lock / unlock)
ALTER TABLE users
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
    AFTER is_first_login;
