ALTER TABLE topic_attachments
    ADD COLUMN file_name VARCHAR(255) NULL AFTER file_uri,
    ADD COLUMN file_content LONGBLOB NULL AFTER file_name;
