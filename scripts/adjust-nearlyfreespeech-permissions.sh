#!/bin/bash
# Give the web server (group "web") write access to Laravel's writable paths.
# Run from the app root on the NFSN server: ./scripts/adjust-nearlyfreespeech-permissions.sh
#
# The SSH user can't chown to "web", but is a member of that group, so chgrp works.
# Files the web server created are already owned by "web" and can't be touched by
# the SSH user, so only files owned by the current user are adjusted.

set -euo pipefail

directories=(
    "database"
    "storage"
    "bootstrap/cache"
)

for directory in "${directories[@]}"; do
    find "$directory" -user "$(id -un)" -exec chgrp web {} + -exec chmod ug+rwX {} +
done
