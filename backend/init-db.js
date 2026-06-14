import { createPool, dbName } from "./db.js";
import { defaultServices } from "./default-services.js";

const bootstrapPool = createPool({ withDatabase: false });

const ddl = [
  `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `USE \`${dbName}\``,
  `CREATE TABLE IF NOT EXISTS services (
    code VARCHAR(8) PRIMARY KEY,
    emoji VARCHAR(16) NOT NULL DEFAULT '📋',
    name_ta VARCHAR(255) NOT NULL,
    name_si VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS token_counters (
    service_code VARCHAR(8) PRIMARY KEY,
    counter INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_counters_service
      FOREIGN KEY (service_code) REFERENCES services(code)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS token_issues (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(32) NOT NULL,
    service_code VARCHAR(8) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    issued_year SMALLINT NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_issues_year_service (issued_year, service_code),
    CONSTRAINT fk_token_issues_service
      FOREIGN KEY (service_code) REFERENCES services(code)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    mobile VARCHAR(32) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_feedback_created_at (created_at),
    INDEX idx_feedback_rating (rating)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

try {
  for (const statement of ddl) {
    await bootstrapPool.query(statement);
  }
  for (const service of defaultServices) {
    await bootstrapPool.query(
      `INSERT INTO services (code, emoji, name_ta, name_si, name_en)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         emoji = VALUES(emoji),
         name_ta = VALUES(name_ta),
         name_si = VALUES(name_si),
         name_en = VALUES(name_en),
         active = 1`,
      [service.code, service.emoji, service.ta, service.si, service.en],
    );
  }
  console.log(`MySQL database ready: ${dbName}`);
} finally {
  await bootstrapPool.end();
}
