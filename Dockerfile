FROM rust:1.64.0-slim AS backend

WORKDIR /app

COPY backend backend
COPY Cargo.toml Cargo.toml
COPY Cargo.lock Cargo.lock

RUN cargo build --release

FROM node:19-slim AS frontend

WORKDIR /app

COPY frontend frontend

WORKDIR /app/frontend

RUN yarn && yarn build

FROM debian:stable-slim

RUN apt-get update &&\
    apt-get install -y ca-certificates &&\
    rm -rf /var/lib/apt/lists/*

COPY --from=backend /app/target/release/cheph-backend /usr/local/bin/cheph-backend
COPY --from=frontend /app/frontend/build /srv/static

ENV STATIC_FILE_DIRECTORY=/srv/static

CMD ["cheph-backend"]
