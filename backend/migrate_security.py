from sqlalchemy import inspect, text

from database import engine


USER_COLUMNS = {
    "is_admin": "BOOLEAN NOT NULL DEFAULT 0",
    "otp_attempts": "INTEGER NOT NULL DEFAULT 0",
    "otp_resend_count": "INTEGER NOT NULL DEFAULT 0",
    "otp_last_sent_at": "DATETIME",
    "otp_window_started_at": "DATETIME",
}


with engine.begin() as connection:
    inspector = inspect(connection)
    existing_columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    for column_name, definition in USER_COLUMNS.items():
        if column_name not in existing_columns:
            connection.execute(
                text(
                    f"ALTER TABLE users ADD COLUMN {column_name} {definition}"
                )
            )
            print(f"Added users.{column_name}")
        else:
            print(f"Already exists: users.{column_name}")

print("Security database migration complete.")
