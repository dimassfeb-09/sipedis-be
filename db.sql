CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO
    users (id, name, email, password)
VALUES (
        0,
        'bot',
        'bot@gmail.com',
        'bot'
    );

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    owner_id INTEGER NOT NULL REFERENCES users (id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id),
    content TEXT NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (
        sender_type IN ('user', 'bot')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ALTER COLUMN user_id DROP NOT NULL;