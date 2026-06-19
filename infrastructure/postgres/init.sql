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
    embedding vector(768) not null,
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
