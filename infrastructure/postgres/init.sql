create extension if not exists vector;

create table if not exists document_metadata (
    id uuid primary key,
    filename text not null,
    content_type text,
    size_bytes bigint,
    created_at timestamptz not null default now()
);

create table if not exists chunk_embedding (
    id uuid primary key,
    source_id uuid not null,
    source_type text not null,
    sequence integer not null,
    content text not null,
    embedding vector(1536) not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists chunk_embedding_vector_idx
    on chunk_embedding
    using hnsw (embedding vector_cosine_ops);

create index if not exists chunk_embedding_source_idx
    on chunk_embedding (source_id, source_type);

create table if not exists app_user (
    id          uuid primary key default gen_random_uuid(),
    username    text not null unique,
    password    text not null,
    role        text not null default 'USER',
    enabled     boolean not null default true,
    created_at  timestamptz not null default now()
);

-- Enable pgcrypto extension for native bcrypt hashing
create extension if not exists pgcrypto;

-- Insert default users with BCrypt-hashed passwords
insert into app_user (username, password, role, enabled)
values 
    ('admin@gems.ai', crypt('admin123', gen_salt('bf', 10)), 'ADMIN', true),
    ('user@gems.ai', crypt('user123', gen_salt('bf', 10)), 'USER', true)
on conflict (username) do nothing;

create table if not exists chat_session (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_user(id) on delete cascade,
    title text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists chat_message (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references chat_session(id) on delete cascade,
    sender text not null,
    content text not null,
    citations jsonb,
    created_at timestamptz not null default now()
);

create index if not exists chat_session_user_idx on chat_session(user_id);
create index if not exists chat_message_session_idx on chat_message(session_id, created_at);

