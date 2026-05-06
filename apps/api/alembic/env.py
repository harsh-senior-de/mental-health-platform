from alembic import context

config = context.config


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=None, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    pass


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
