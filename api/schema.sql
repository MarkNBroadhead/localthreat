CREATE SCHEMA IF NOT EXISTS postgres
    AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS postgres.reports
(
    id text COLLATE pg_catalog."default" NOT NULL,
    data text[] COLLATE pg_catalog."default",
    "time" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reports_pkey PRIMARY KEY (id)
)