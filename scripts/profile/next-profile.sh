#!/bin/sh
set -eu

export NODE_OPTIONS="${NODE_OPTIONS-} --cpu-prof --heap-prof"
pnpm web:build
pnpm web:start
