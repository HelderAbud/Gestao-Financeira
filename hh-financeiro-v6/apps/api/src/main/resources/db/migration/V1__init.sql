CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description VARCHAR(512) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description VARCHAR(512) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    expense_type VARCHAR(20) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    entry_date DATE NOT NULL,
    notes VARCHAR(2000),
    subscription_id BIGINT REFERENCES subscriptions (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_period ON expenses (user_id, year, month);

CREATE TABLE incomes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description VARCHAR(512) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    entry_date DATE NOT NULL,
    notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incomes_user_period ON incomes (user_id, year, month);

CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description VARCHAR(512) NOT NULL,
    target_amount NUMERIC(19, 2) NOT NULL,
    current_amount NUMERIC(19, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE goal_deposits (
    id BIGSERIAL PRIMARY KEY,
    goal_id BIGINT NOT NULL REFERENCES goals (id) ON DELETE CASCADE,
    amount NUMERIC(19, 2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    planned_amount NUMERIC(19, 2) NOT NULL,
    UNIQUE (user_id, year, month, category)
);

CREATE TABLE subscription_processed (
    id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL REFERENCES subscriptions (id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    UNIQUE (subscription_id, year, month)
);
