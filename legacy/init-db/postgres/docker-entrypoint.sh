#!/bin/sh
set -e

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  rm -rf "$PGDATA"/*
  initdb -D "$PGDATA" --auth-local=trust --auth-host=trust
fi
exec "$@"
