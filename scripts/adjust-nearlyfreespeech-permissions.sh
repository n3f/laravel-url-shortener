#!/bin/bash

directories=(
    "database"
    "storage"
    "bootstrap/cache"
)

for directory in "${directories[@]}"; do
    chown -R web "$directory"
    chmod -R 775 "$directory"
done
