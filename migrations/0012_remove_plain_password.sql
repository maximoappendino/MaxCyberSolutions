-- Erase all stored plaintext passwords; columns kept for schema stability
UPDATE owners SET plain_password = NULL;
UPDATE collaborators SET plain_password = NULL;
