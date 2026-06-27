#!/usr/bin/env bash
# Starts the Vite dev server with the nvm-installed Node on PATH.
# --host exposes it on the local network so a phone on the same Wi-Fi can open it.
export PATH="/Users/vincejoshuam.arellano/.nvm/versions/node/v24.18.0/bin:$PATH"
cd "/Users/vincejoshuam.arellano/Claude/Projects/Fitness Coaching/gym-logger" || exit 1
exec npm run dev -- --host
