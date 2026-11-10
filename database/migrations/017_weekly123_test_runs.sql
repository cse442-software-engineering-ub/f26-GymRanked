-- Card #123 test-server-only browser resets. Apply after 016 on the explicitly enabled test database.
-- This table holds one lease per dedicated account; it does not change ordinary user data.
CREATE TABLE IF NOT EXISTS weekly123_test_runs (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  run_id CHAR(36) NOT NULL,
  test_number TINYINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  lease_until DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_weekly123_run (client_id, run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
